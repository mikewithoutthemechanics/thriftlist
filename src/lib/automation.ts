import { chromium, Page } from 'playwright-core';
import Browserbase from '@browserbasehq/sdk';
import { createClient } from '@supabase/supabase-js';
import { SA_PLATFORMS } from './platforms';
import { sendEmail, generatePostingSuccessEmail, generatePostingFailureEmail } from './email';
import { postToFacebookAPI, hasAPISupport, getPlatformAPIConfig, ClothingItem } from './platform-apis';
import path from 'path';
import fs from 'fs';
import os from 'os';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface AutomationJob {
  itemId: string;
  platforms: string[];
  userId: string;
}

export async function runAutomation(job: AutomationJob) {
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('*')
    .eq('id', job.itemId)
    .single();

  if (itemError || !item) throw new Error('Item not found');

  const { data: settingsData } = await supabase
    .from('settings')
    .select('key, value')
    .eq('user_id', job.userId);

  const settings: Record<string, string> = {};
  for (const s of settingsData || []) settings[s.key] = s.value;

  for (const platformId of job.platforms) {
    const platform = SA_PLATFORMS.find(p => p.id === platformId);
    if (!platform) continue;

    // Create pending posting record
    const { data: postingData, error: postingError } = await supabase
      .from('postings')
      .insert({
        user_id: job.userId,
        item_id: job.itemId,
        platform: platformId,
        status: 'pending',
      })
      .select()
      .single();

    const pid = postingData?.id;

    try {
      const postingUrl = await postToPlatform(platformId, item, settings);
      if (pid) {
        await supabase
          .from('postings')
          .update({
            status: 'posted',
            url: postingUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pid);

        // Send success email notification
        const { data: userData } = await supabase.auth.admin.getUserById(job.userId);
        if (userData?.user?.email) {
          const email = generatePostingSuccessEmail(item.title, platformId, postingUrl || undefined);
          email.to = userData.user.email;
          await sendEmail(email);
        }
      }
    } catch (err: any) {
      console.error(`Automation failed for ${platformId}:`, err);
      if (pid) {
        await supabase
          .from('postings')
          .update({
            status: 'failed',
            error: err.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pid);

        // Send failure email notification
        const { data: userData } = await supabase.auth.admin.getUserById(job.userId);
        if (userData?.user?.email) {
          const email = generatePostingFailureEmail(item.title, platformId, err.message);
          email.to = userData.user.email;
          await sendEmail(email);
        }
      }
    }
  }
}

async function postToPlatform(platformId: string, item: ItemData, settings: Record<string, string>, retryCount = 0): Promise<string | null> {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds

  try {
    // Check if platform has API support and if credentials are configured
    if (hasAPISupport(platformId)) {
      const config = getPlatformAPIConfig(platformId, settings);
      // For Facebook, check if we have an access token
      if (platformId === 'facebook_marketplace' && config.accessToken) {
        // Convert item to ClothingItem for API function (adding missing properties)
        const apiItem: ClothingItem = {
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          category: item.category,
          size: item.size,
          brand: item.brand,
          condition: item.condition as 'new' | 'like_new' | 'good' | 'fair' | 'poor',
          color: item.color,
          photos: item.photos,
          platforms: (item as any).platforms || [],
          status: (item as any).status || 'draft',
          createdAt: (item as any).createdAt || new Date().toISOString(),
          updatedAt: (item as any).updatedAt || new Date().toISOString()
        };
        
        const apiResponse = await postToFacebookAPI(apiItem, config);
        if (apiResponse.success) {
          return apiResponse.url ?? null;
        }
        // If API fails, fall back to browser automation
        console.warn(`Facebook API failed: ${apiResponse.error}. Falling back to browser automation.`);
      }
    }

    // Browser selection based on user settings or env var fallback
    const browserType = settings.automation_browser || process.env.USE_CLOAK_BROWSER === 'true' ? 'cloakbrowser' : 'browserbase';
    const useCloakBrowser = browserType === 'cloakbrowser';
    const useBrowserbase = browserType === 'browserbase' && !!process.env.BROWSERBASE_API_KEY && !!process.env.BROWSERBASE_PROJECT_ID;
    let browser: any;
    let page: Page;

    if (useCloakBrowser) {
      // CloakBrowser: stealth Chromium with anti-detection
      const isVercel = process.env.VERCEL === '1';
      if (isVercel) {
        throw new Error('CloakBrowser requires local environment. Use Browserbase for Vercel deployment.');
      }
      const cloakModule = await import('cloakbrowser');
      browser = await (cloakModule as any).chromium.launch({
        headless: false,
        // CloakBrowser handles stealth internally
      });
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      page = await context.newPage();
      console.log('CloakBrowser session started');
    } else if (useBrowserbase) {
      // Browserbase: cloud headless browser with proxies
      const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });
      const session = await bb.sessions.create({
        projectId: process.env.BROWSERBASE_PROJECT_ID!,
        proxies: true,
      });
      browser = await chromium.connectOverCDP(session.connectUrl);
      const context = browser.contexts()[0] || await browser.newContext({ viewport: { width: 1280, height: 800 } });
      page = await context.newPage();
      console.log(`Browserbase session started: ${session.id}`);
    } else {
      // Fallback: local Playwright
      const isVercel = process.env.VERCEL === '1';
      if (isVercel) {
        throw new Error('Browserbase API key is required for automation on Vercel. Set BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID environment variables.');
      }
      browser = await chromium.launch({
        headless: false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--window-size=1280,800',
        ],
      });
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      page = await context.newPage();
    }

    // Inject anti-detection script
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      (window as any).chrome = { runtime: {} };
    });

    let postingUrl: string | null = null;

    try {
      switch (platformId) {
        case 'facebook_marketplace':
          postingUrl = await postToFacebook(page, item, settings);
          break;
        case 'yaga':
          postingUrl = await postToYaga(page, item, settings);
          break;
        case 'gumtree':
          postingUrl = await postToGumtree(page, item, settings);
          break;
        case 'olx':
          postingUrl = await postToOlx(page, item, settings);
          break;
        case 'junkmail':
          postingUrl = await postToJunkMail(page, item, settings);
          break;
        case 'whatsapp_groups':
          postingUrl = await postToWhatsAppGroups(page, item, settings);
          break;
        default:
          throw new Error('Unknown platform');
      }
    } finally {
      // Close browser session
      try {
        await browser.close();
      } catch {
        // ignore close errors
      }
    }

    return postingUrl;
  } catch (err: any) {
    console.error(`Posting to ${platformId} failed (attempt ${retryCount + 1}/${maxRetries}):`, err);

    if (retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return postToPlatform(platformId, item, settings, retryCount + 1);
    }

    throw err;
  }
}

interface ItemData {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  size: string;
  brand: string;
  condition: string;
  color: string;
  photos: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function downloadPhoto(photoUrl: string): Promise<string> {
  // If it's already a local path, return it
  if (!photoUrl.startsWith('http')) {
    const localPath = path.join(process.cwd(), 'public', photoUrl);
    if (fs.existsSync(localPath)) return localPath;
  }

  // Download from URL (Supabase Storage or external)
  const res = await fetch(photoUrl);
  if (!res.ok) throw new Error(`Failed to download photo: ${photoUrl}`);
  
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = path.extname(new URL(photoUrl).pathname) || '.jpg';
  const tmpPath = path.join(os.tmpdir(), `photo-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  fs.writeFileSync(tmpPath, buffer);
  return tmpPath;
}

function getPhotoPath(photoUrl: string): string {
  // Legacy fallback for local paths
  return path.join(process.cwd(), 'public', photoUrl);
}

async function safeFill(page: Page, selectors: string[], value: string, label: string) {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.count() > 0) {
        await loc.fill(value);
        console.log(`Filled ${label} with selector: ${sel}`);
        return true;
      }
    } catch {
      // continue to next selector
    }
  }
  console.warn(`Could not fill ${label}`);
  return false;
}

async function safeClick(page: Page, selectors: string[], label: string) {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.count() > 0) {
        await loc.click();
        console.log(`Clicked ${label} with selector: ${sel}`);
        return true;
      }
    } catch {
      // continue
    }
  }
  console.warn(`Could not click ${label}`);
  return false;
}

async function safeUpload(page: Page, selectors: string[], filePath: string, label: string) {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.count() > 0) {
        await loc.setInputFiles(filePath);
        console.log(`Uploaded ${label} with selector: ${sel}`);
        return true;
      }
    } catch {
      // continue
    }
  }
  console.warn(`Could not upload ${label}`);
  return false;
}

async function waitForLogin(page: Page, platformName: string, loginUrlPatterns: string[], targetUrlPattern: RegExp) {
  const url = page.url();
  const needsLogin = loginUrlPatterns.some(p => url.includes(p));
  if (needsLogin) {
    console.log(`Please log in to ${platformName} manually in the opened browser window...`);
    try {
      await page.waitForURL(targetUrlPattern, { timeout: 120000 });
    } catch {
      // If navigation timeout, just wait a bit more then continue
      await page.waitForTimeout(3000);
    }
  }
}

// ─── Facebook Marketplace ───────────────────────────────────────────────────

async function postToFacebook(page: Page, item: ItemData, settings: Record<string, string>): Promise<string | null> {
  await page.goto('https://www.facebook.com/marketplace/create/item');
  await page.waitForTimeout(3000);

  await waitForLogin(page, 'Facebook', ['login'], /marketplace\/create/);

  // Upload photos (up to 10)
  for (const photo of item.photos.slice(0, 10)) {
    const photoPath = await downloadPhoto(photo);
    await safeUpload(page, [
      'input[type="file"]',
      'input[accept*="image"]',
    ], photoPath, 'photo');
    await page.waitForTimeout(1500);
  }

  // Title
  await safeFill(page, [
    'input[placeholder*="title" i]',
    'input[placeholder*="What" i]',
    'label:has-text("Title") + input',
    'label:has-text("Title") ~ input',
    '[role="dialog"] input[type="text"]',
  ], item.title, 'title');

  // Price
  await safeFill(page, [
    'input[placeholder*="price" i]',
    'input[type="number"]',
    'label:has-text("Price") + input',
    'label:has-text("Price") ~ input',
  ], String(item.price), 'price');

  // Description
  const fullDesc = buildFullDescription(item);
  await safeFill(page, [
    'textarea[placeholder*="description" i]',
    'textarea[placeholder*="Describe" i]',
    'label:has-text("Description") + textarea',
    'label:has-text("Description") ~ textarea',
    '[role="dialog"] textarea',
  ], fullDesc, 'description');

  // Category - try to select Clothing/Shoes/Accessories
  const categoryValue = mapFacebookCategory(item.category);
  await safeClick(page, [
    `text="${categoryValue}"`,
    `div[role="button"]:has-text("${categoryValue}")`,
    'span:has-text("Clothing")',
    'span:has-text("Shoes")',
    'span:has-text("Accessories")',
  ], 'category');

  // Condition
  const conditionLabel = mapFacebookCondition(item.condition);
  if (conditionLabel) {
    await safeClick(page, [
      `text="${conditionLabel}"`,
      `span:has-text("${conditionLabel}")`,
    ], 'condition');
  }

  // Location
  if (settings['location']) {
    await safeFill(page, [
      'input[placeholder*="location" i]',
      'input[placeholder*="City" i]',
      'label:has-text("Location") + input',
      'label:has-text("Location") ~ input',
    ], settings['location'], 'location');
    await page.waitForTimeout(1000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  }

  // Try to submit and capture URL
  try {
    await safeClick(page, [
      'button[type="submit"]',
      'div[role="button"]:has-text("Next")',
      'div[role="button"]:has-text("Publish")',
      'span:has-text("Post")',
    ], 'submit');

    // Wait for navigation to confirm page or listing page
    await page.waitForTimeout(5000);
    const currentUrl = page.url();
    if (currentUrl.includes('/marketplace/') && !currentUrl.includes('/create/')) {
      return currentUrl;
    }
  } catch {
    // Submission failed or blocked, leave form open for manual submit
  }

  console.log('Facebook Marketplace form pre-filled. Please review and submit manually.');
  return null;
}

// ─── Yaga ─────────────────────────────────────────────────────────────────

async function postToYaga(page: Page, item: ItemData, settings: Record<string, string>): Promise<string | null> {
  await page.goto('https://yaga.co.za/sell');
  await page.waitForTimeout(3000);

  await waitForLogin(page, 'Yaga', ['login', 'signin', 'auth'], /sell/);

  // Upload photos
  for (const photo of item.photos.slice(0, 5)) {
    const photoPath = await downloadPhoto(photo);
    await safeUpload(page, [
      'input[type="file"]',
      'input[accept*="image"]',
    ], photoPath, 'photo');
    await page.waitForTimeout(2000);
  }

  // Title
  await safeFill(page, [
    'input[name="title"]',
    'input[placeholder*="title" i]',
    'input[placeholder*="What" i]',
    'label:has-text("Title") input',
  ], item.title, 'title');

  // Price
  await safeFill(page, [
    'input[name="price"]',
    'input[placeholder*="price" i]',
    'input[placeholder*="R" i]',
    'label:has-text("Price") input',
  ], String(item.price), 'price');

  // Description
  const fullDesc = buildFullDescription(item);
  await safeFill(page, [
    'textarea[name="description"]',
    'textarea[placeholder*="description" i]',
    'textarea[placeholder*="Tell" i]',
    'label:has-text("Description") textarea',
  ], fullDesc, 'description');

  // Category
  const yagaCategory = mapYagaCategory(item.category);
  if (yagaCategory) {
    await safeClick(page, [
      `text="${yagaCategory}"`,
      `span:has-text("${yagaCategory}")`,
    ], 'category');
  }

  // Brand
  if (item.brand) {
    await safeFill(page, [
      'input[name="brand"]',
      'input[placeholder*="brand" i]',
      'label:has-text("Brand") input',
    ], item.brand, 'brand');
  }

  // Size
  await safeFill(page, [
    'input[name="size"]',
    'input[placeholder*="size" i]',
    'label:has-text("Size") input',
  ], item.size, 'size');

  // Condition
  const yagaCondition = mapYagaCondition(item.condition);
  if (yagaCondition) {
    await safeClick(page, [
      `text="${yagaCondition}"`,
      `span:has-text("${yagaCondition}")`,
    ], 'condition');
  }

  // Color
  if (item.color) {
    await safeFill(page, [
      'input[name="color"]',
      'input[placeholder*="color" i]',
      'label:has-text("Color") input',
    ], item.color, 'color');
  }

  // Try to submit and capture URL
  try {
    await safeClick(page, [
      'button[type="submit"]',
      'button:has-text("Publish")',
      'button:has-text("Post")',
      'button:has-text("Sell")',
    ], 'submit');

    await page.waitForTimeout(5000);
    const currentUrl = page.url();
    if (currentUrl.includes('/item/') || currentUrl.includes('/listing/')) {
      return currentUrl;
    }
  } catch {
    // Submission failed or blocked
  }

  console.log('Yaga form pre-filled. Please review and submit manually.');
  return null;
}

// ─── Gumtree ──────────────────────────────────────────────────────────────

async function postToGumtree(page: Page, item: ItemData, settings: Record<string, string>): Promise<string | null> {
  await page.goto('https://www.gumtree.co.za/postad');
  await page.waitForTimeout(3000);

  await waitForLogin(page, 'Gumtree', ['login', 'signin'], /postad/);

  // Category selection - try to navigate to Clothing & Accessories
  const gumtreeCategory = mapGumtreeCategory(item.category);
  if (gumtreeCategory) {
    await safeClick(page, [
      `text="${gumtreeCategory}"`,
      `a:has-text("${gumtreeCategory}")`,
      'span:has-text("Clothing")',
      'span:has-text("Accessories")',
    ], 'category');
    await page.waitForTimeout(2000);
  }

  // Title
  await safeFill(page, [
    'input[name="title"]',
    'input[id*="title" i]',
    'input[placeholder*="title" i]',
    'label:has-text("Title") input',
  ], item.title, 'title');

  // Price
  await safeFill(page, [
    'input[name="price"]',
    'input[id*="price" i]',
    'input[placeholder*="price" i]',
    'input[type="number"]',
    'label:has-text("Price") input',
  ], String(item.price), 'price');

  // Description
  const fullDesc = buildFullDescription(item);
  await safeFill(page, [
    'textarea[name="description"]',
    'textarea[id*="description" i]',
    'textarea[placeholder*="description" i]',
    'label:has-text("Description") textarea',
  ], fullDesc, 'description');

  // Upload photos
  for (const photo of item.photos.slice(0, 8)) {
    const photoPath = await downloadPhoto(photo);
    await safeUpload(page, [
      'input[type="file"]',
      'input[accept*="image"]',
    ], photoPath, 'photo');
    await page.waitForTimeout(2000);
  }

  // Location
  if (settings['location']) {
    await safeFill(page, [
      'input[name="location"]',
      'input[id*="location" i]',
      'input[placeholder*="location" i]',
      'input[placeholder*="city" i]',
      'label:has-text("Location") input',
    ], settings['location'], 'location');
  }

  // Contact info from settings
  if (settings['gumtree_email']) {
    await safeFill(page, [
      'input[type="email"]',
      'input[name="email"]',
      'input[id*="email" i]',
      'label:has-text("Email") input',
    ], settings['gumtree_email'], 'email');
  }

  console.log('Gumtree form pre-filled. Please review and submit manually.');
  return null;
}

// ─── OLX ───────────────────────────────────────────────────────────────────

async function postToOlx(page: Page, item: ItemData, settings: Record<string, string>): Promise<string | null> {
  await page.goto('https://www.olx.co.za/post-ad');
  await page.waitForTimeout(3000);

  await waitForLogin(page, 'OLX', ['login', 'signin'], /post-ad/);

  // Category selection
  const olxCategory = mapOlxCategory(item.category);
  if (olxCategory) {
    await safeClick(page, [
      `text="${olxCategory}"`,
      `a:has-text("${olxCategory}")`,
      'span:has-text("Clothes")',
      'span:has-text("Fashion")',
    ], 'category');
    await page.waitForTimeout(2000);
  }

  // Title
  await safeFill(page, [
    'input[name="title"]',
    'input[id*="title" i]',
    'input[placeholder*="title" i]',
    'label:has-text("Title") input',
  ], item.title, 'title');

  // Price
  await safeFill(page, [
    'input[name="price"]',
    'input[id*="price" i]',
    'input[placeholder*="price" i]',
    'input[type="number"]',
    'label:has-text("Price") input',
  ], String(item.price), 'price');

  // Description
  const fullDesc = buildFullDescription(item);
  await safeFill(page, [
    'textarea[name="description"]',
    'textarea[id*="description" i]',
    'textarea[placeholder*="description" i]',
    'label:has-text("Description") textarea',
  ], fullDesc, 'description');

  // Upload photos
  for (const photo of item.photos.slice(0, 8)) {
    const photoPath = await downloadPhoto(photo);
    await safeUpload(page, [
      'input[type="file"]',
      'input[accept*="image"]',
    ], photoPath, 'photo');
    await page.waitForTimeout(2000);
  }

  // Location
  if (settings['location']) {
    await safeFill(page, [
      'input[name="location"]',
      'input[id*="location" i]',
      'input[placeholder*="location" i]',
      'label:has-text("Location") input',
    ], settings['location'], 'location');
    await page.waitForTimeout(1000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  }

  // Contact
  if (settings['olx_email']) {
    await safeFill(page, [
      'input[type="email"]',
      'input[name="email"]',
      'input[id*="email" i]',
      'label:has-text("Email") input',
    ], settings['olx_email'], 'email');
  }

  console.log('OLX form pre-filled. Please review and submit manually.');
  return null;
}

// ─── Junk Mail ─────────────────────────────────────────────────────────────

async function postToJunkMail(page: Page, item: ItemData, settings: Record<string, string>): Promise<string | null> {
  await page.goto('https://www.junkmail.co.za/post-ad');
  await page.waitForTimeout(3000);

  await waitForLogin(page, 'Junk Mail', ['login', 'signin'], /post-ad/);

  // Category selection
  const junkmailCategory = mapJunkmailCategory(item.category);
  if (junkmailCategory) {
    await safeClick(page, [
      `text="${junkmailCategory}"`,
      `a:has-text("${junkmailCategory}")`,
      'span:has-text("Clothing")',
      'span:has-text("Fashion")',
    ], 'category');
    await page.waitForTimeout(2000);
  }

  // Title
  await safeFill(page, [
    'input[name="title"]',
    'input[id*="title" i]',
    'input[placeholder*="title" i]',
    'label:has-text("Title") input',
  ], item.title, 'title');

  // Price
  await safeFill(page, [
    'input[name="price"]',
    'input[id*="price" i]',
    'input[placeholder*="price" i]',
    'input[type="number"]',
    'label:has-text("Price") input',
  ], String(item.price), 'price');

  // Description
  const fullDesc = buildFullDescription(item);
  await safeFill(page, [
    'textarea[name="description"]',
    'textarea[id*="description" i]',
    'textarea[placeholder*="description" i]',
    'label:has-text("Description") textarea',
  ], fullDesc, 'description');

  // Upload photos
  for (const photo of item.photos.slice(0, 6)) {
    const photoPath = await downloadPhoto(photo);
    await safeUpload(page, [
      'input[type="file"]',
      'input[accept*="image"]',
    ], photoPath, 'photo');
    await page.waitForTimeout(2000);
  }

  // Location
  if (settings['location']) {
    await safeFill(page, [
      'input[name="location"]',
      'input[id*="location" i]',
      'input[placeholder*="location" i]',
      'label:has-text("Location") input',
    ], settings['location'], 'location');
  }

  // Contact
  if (settings['junkmail_email']) {
    await safeFill(page, [
      'input[type="email"]',
      'input[name="email"]',
      'input[id*="email" i]',
      'label:has-text("Email") input',
    ], settings['junkmail_email'], 'email');
  }

  console.log('Junk Mail form pre-filled. Please review and submit manually.');
  return null;
}

// ─── WhatsApp Groups ───────────────────────────────────────────────────────

async function postToWhatsAppGroups(page: Page, item: ItemData, settings: Record<string, string>): Promise<string | null> {
  const groupLinks = settings['whatsapp_groups'];
  if (!groupLinks) {
    throw new Error('No WhatsApp groups configured. Please add group links in Settings.');
  }

  const groups = groupLinks.split(',').map(g => g.trim()).filter(g => g.length > 0);
  if (groups.length === 0) {
    throw new Error('No WhatsApp groups configured. Please add group links in Settings.');
  }

  await page.goto('https://web.whatsapp.com');
  await page.waitForTimeout(5000);

  // Wait for user to scan QR code if not logged in
  await waitForLogin(page, 'WhatsApp', ['login', 'auth', 'scan'], /web.whatsapp.com\/$/);

  const fullDesc = buildFullDescription(item);
  
  // Get custom message template from settings, or use default
  const template = settings['whatsapp_message_template'] || 
    `🛍️ *{title}*\n💰 R{price}\n\n📝 {description}\n\nCondition: {condition}\nSize: {size}{brand_line}{color_line}`;
    
  // Replace placeholders in template
  const message = template
    .replace('{title}', item.title)
    .replace('{price}', String(item.price))
    .replace('{description}', item.description)
    .replace('{condition}', item.condition)
    .replace('{size}', item.size)
    .replace('{brand_line}', item.brand ? `\nBrand: ${item.brand}` : '')
    .replace('{color_line}', item.color ? `\nColor: ${item.color}` : '')
    .replace('{full_description}', fullDesc);

  let postedCount = 0;

  for (const groupLink of groups) {
    try {
      console.log(`Posting to WhatsApp group: ${groupLink}`);
      
      // Navigate to the group via invite link
      await page.goto(groupLink);
      await page.waitForTimeout(4000);

      // Check if we're on a valid WhatsApp group page
      const url = page.url();
      if (!url.includes('web.whatsapp.com')) {
        console.warn(`Invalid WhatsApp group link: ${groupLink}`);
        continue;
      }

      // Click the message input area
      await safeClick(page, [
        '[contenteditable="true"]',
        'div[data-placeholder="Type a message"]',
        'div[role="textbox"]',
      ], 'message input');
      await page.waitForTimeout(1000);

      // Type the message
      await page.keyboard.type(message, { delay: 50 });
      await page.waitForTimeout(500);

      // Send the message
      await safeClick(page, [
        '[data-testid="send"]',
        'button[data-testid="send"]',
        'span[data-testid="send"]',
        'button[aria-label="Send"]',
      ], 'send button');
      
      await page.waitForTimeout(2000);
      postedCount++;
      console.log(`Posted to WhatsApp group: ${groupLink}`);
    } catch (err) {
      console.warn(`Failed to post to WhatsApp group ${groupLink}:`, err);
    }
  }

  if (postedCount === 0) {
    throw new Error('Failed to post to any WhatsApp group. Please check your group links.');
  }

  return `Posted to ${postedCount} WhatsApp group(s)`;
}

// ─── Category / Condition Mappings ──────────────────────────────────────────

function buildFullDescription(item: ItemData): string {
  const parts = [
    item.description,
    '',
    `Condition: ${item.condition}`,
    `Size: ${item.size}`,
  ];
  if (item.brand) parts.push(`Brand: ${item.brand}`);
  if (item.color) parts.push(`Color: ${item.color}`);
  return parts.join('\n');
}

function mapFacebookCategory(category: string): string {
  return 'Clothing, Shoes & Accessories';
}

function mapFacebookCondition(condition: string): string | null {
  const map: Record<string, string> = {
    new: 'New',
    like_new: 'Like New',
    good: 'Used - Good',
    fair: 'Used - Fair',
    poor: 'Used - Fair',
  };
  return map[condition] || 'Used - Good';
}

function mapYagaCategory(category: string): string | null {
  const map: Record<string, string> = {
    Tops: 'Tops',
    Bottoms: 'Bottoms',
    Dresses: 'Dresses',
    Outerwear: 'Jackets & Coats',
    Shoes: 'Shoes',
    Accessories: 'Accessories',
    Activewear: 'Sportswear',
    Swimwear: 'Swimwear',
    'Formal Wear': 'Formal Wear',
    Vintage: 'Vintage',
  };
  return map[category] || 'Clothing';
}

function mapYagaCondition(condition: string): string | null {
  const map: Record<string, string> = {
    new: 'New with tags',
    like_new: 'Like new',
    good: 'Good',
    fair: 'Fair',
    poor: 'Fair',
  };
  return map[condition] || 'Good';
}

function mapGumtreeCategory(category: string): string | null {
  return 'Clothing & Accessories';
}

function mapOlxCategory(category: string): string | null {
  return 'Clothes, Fashion & Beauty';
}

function mapJunkmailCategory(category: string): string | null {
  return 'Clothing & Fashion';
}

