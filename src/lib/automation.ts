import { chromium, Page, Browser, BrowserContext } from 'playwright-core';
import { launch } from 'cloakbrowser';
import Browserbase from '@browserbasehq/sdk';
import { createClient } from '@supabase/supabase-js';
import { SA_PLATFORMS } from './platforms';
import { createNotification } from './notifications';
import path from 'path';
import fs from 'fs';
import os from 'os';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface AutomationJob {
  itemId: string;
  platforms: string[];
  userId: string;
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

export async function runAutomation(job: AutomationJob) {
  const supabase = getSupabase();
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

    const { data: postingData } = await supabase
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
      const postingUrl = await postToPlatform(platformId, item, settings, job.userId);
      if (pid) {
        await supabase
          .from('postings')
          .update({
            status: 'posted',
            url: postingUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pid);

        await createNotification(
          job.userId,
          'success',
          `Posted to ${platformId}`,
          `"${item.title}" was successfully posted${postingUrl ? ' and is now live' : ''}.`,
          { itemId: job.itemId, platform: platformId, url: postingUrl || null }
        );
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

        await createNotification(
          job.userId,
          'error',
          `Failed to post to ${platformId}`,
          `"${item.title}" could not be posted: ${err.message}`,
          { itemId: job.itemId, platform: platformId, error: err.message }
        );
      }
    }
  }
}

// ─── Encryption ─────────────────────────────────────────────────────────────

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

async function deriveKey(keyStr: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyData = enc.encode(keyStr.padEnd(32, '0').slice(0, 32));
  return crypto.subtle.importKey('raw', keyData, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptData(data: any): Promise<string | null> {
  if (!ENCRYPTION_KEY) return JSON.stringify(data);
  try {
    const key = await deriveKey(ENCRYPTION_KEY);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(data));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
  } catch (err) {
    console.warn('Cookie encryption failed, storing plain:', err);
    return JSON.stringify(data);
  }
}

async function decryptData(encrypted: string): Promise<any> {
  if (!ENCRYPTION_KEY) return JSON.parse(encrypted);
  // Heuristic: if it looks like plain JSON, return as-is (migration path)
  if (encrypted.trim().startsWith('[') || encrypted.trim().startsWith('{')) {
    return JSON.parse(encrypted);
  }
  try {
    const key = await deriveKey(ENCRYPTION_KEY);
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(plaintext));
  } catch (err) {
    console.warn('Cookie decryption failed, trying plain JSON:', err);
    return JSON.parse(encrypted);
  }
}

// ─── Cookie Management ──────────────────────────────────────────────────────

async function getStoredCookies(userId: string, platform: string): Promise<any[] | null> {
  const { data } = await getSupabase()
    .from('platform_cookies')
    .select('cookies')
    .eq('user_id', userId)
    .eq('platform', platform)
    .single();
  if (!data?.cookies) return null;
  try {
    const decrypted = await decryptData(data.cookies);
    return Array.isArray(decrypted) ? decrypted : null;
  } catch {
    return null;
  }
}

async function saveCookies(userId: string, platform: string, cookies: any[]) {
  const encrypted = await encryptData(cookies);
  await getSupabase()
    .from('platform_cookies')
    .upsert({
      user_id: userId,
      platform,
      cookies: encrypted,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' });
}

// ─── Browser Session ──────────────────────────────────────────────────────

async function createBrowserSession(userId: string, platform: string) {
  const browser = await launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  const storedCookies = await getStoredCookies(userId, platform);
  if (storedCookies && storedCookies.length > 0) {
    await context.addCookies(storedCookies);
  }

  const page = await context.newPage();

  return { browser, context, page };
}

async function closeBrowserSession(browser: Browser, context: BrowserContext, userId: string, platform: string) {
  try {
    const cookies = await context.cookies();
    if (cookies.length > 0) {
      await saveCookies(userId, platform, cookies);
    }
  } catch (e) {
    console.warn('Failed to save cookies:', e);
  }
  try {
    await browser.close();
  } catch {
    // ignore
  }
}

// ─── Human-like delays ────────────────────────────────────────────────────

async function humanDelay(page: Page, minMs = 200, maxMs = 800) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await page.waitForTimeout(delay);
}

// ─── Safe helpers ───────────────────────────────────────────────────────────

async function safeFill(page: Page, selectors: string[], value: string, label: string) {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.count() > 0) {
        await loc.scrollIntoViewIfNeeded();
        await humanDelay(page, 100, 300);
        await loc.click();
        await humanDelay(page, 50, 150);
        await loc.fill(value);
        console.log(`Filled ${label} with selector: ${sel}`);
        return true;
      }
    } catch {
      // continue
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
        await loc.scrollIntoViewIfNeeded();
        await humanDelay(page, 100, 300);
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

// ─── Screenshot on failure ────────────────────────────────────────────────

async function screenshotOnFailure(page: Page, userId: string, platform: string, itemId: string) {
  try {
    const buffer = await page.screenshot({ fullPage: true });
    const fileName = `screenshots/${userId}/${platform}/${itemId}-${Date.now()}.png`;
    const sb = getSupabase();
    const { error } = await sb.storage.from('uploads').upload(fileName, buffer, {
      contentType: 'image/png',
      upsert: true,
    });
    if (!error) {
      const { data } = sb.storage.from('uploads').getPublicUrl(fileName);
      console.log(`Screenshot saved: ${data.publicUrl}`);
      return data.publicUrl;
    }
  } catch (e) {
    console.warn('Failed to take screenshot:', e);
  }
  return null;
}

// ─── Photo download ───────────────────────────────────────────────────────

async function downloadPhoto(photoUrl: string): Promise<string> {
  if (!photoUrl.startsWith('http')) {
    const localPath = path.join(process.cwd(), 'public', photoUrl);
    if (fs.existsSync(localPath)) return localPath;
  }

  const res = await fetch(photoUrl, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Failed to download photo: ${photoUrl} (status ${res.status})`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = path.extname(new URL(photoUrl).pathname) || '.jpg';
  const tmpPath = path.join(os.tmpdir(), `photo-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  fs.writeFileSync(tmpPath, buffer);
  return tmpPath;
}

// ─── Login detection ────────────────────────────────────────────────────────

async function isLoginPage(page: Page): Promise<boolean> {
  const url = page.url().toLowerCase();
  const loginIndicators = ['login', 'signin', 'sign-in', 'auth', 'authenticate', 'password'];
  if (loginIndicators.some(ind => url.includes(ind))) return true;
  try {
    const count = await page.locator('input[type="password"], form:has(input[type="password"])').count();
    if (count > 0) return true;
  } catch { /* ignore */ }
  return false;
}

// ─── Core posting engine ────────────────────────────────────────────────────

async function postToPlatform(platformId: string, item: ItemData, settings: Record<string, string>, userId: string, retryCount = 0): Promise<string | null> {
  const maxRetries = 2;
  const baseDelay = 3000;

  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  let page: Page | undefined;
  let screenshotUrl: string | null = null;

  try {
    const session = await createBrowserSession(userId, platformId);
    browser = session.browser;
    context = session.context;
    page = session.page;

    let postingUrl: string | null = null;

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
      default:
        throw new Error(`Unknown platform: ${platformId}`);
    }

    return postingUrl;
  } catch (err: any) {
    console.error(`Posting to ${platformId} failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);

    if (page) {
      screenshotUrl = await screenshotOnFailure(page, userId, platformId, item.id);
    }

    if (retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));

      if (err.message?.includes('login') || err.message?.includes('auth') || err.message?.includes('session')) {
        await getSupabase().from('platform_cookies').delete().eq('user_id', userId).eq('platform', platformId);
        console.log(`Cleared cookies for ${platformId} due to auth error`);
      }

      return postToPlatform(platformId, item, settings, userId, retryCount + 1);
    }

    throw new Error(`${err.message}${screenshotUrl ? ` (screenshot: ${screenshotUrl})` : ''}`);
  } finally {
    if (browser && context) {
      await closeBrowserSession(browser, context, userId, platformId);
    }
  }
}

// ─── Facebook Marketplace ───────────────────────────────────────────────────

async function postToFacebook(page: Page, item: ItemData, settings: Record<string, string>): Promise<string | null> {
  await page.goto('https://www.facebook.com/marketplace/create/item');
  await page.waitForTimeout(3000);

  if (await isLoginPage(page)) {
    throw new Error('Facebook login required. Please authenticate via Settings > Platform Authentication.');
  }

  for (const photo of item.photos.slice(0, 10)) {
    const photoPath = await downloadPhoto(photo);
    await safeUpload(page, [
      'input[type="file"]',
      'input[accept*="image"]',
    ], photoPath, 'photo');
    await humanDelay(page, 1500, 2500);
  }

  await safeFill(page, [
    'input[placeholder*="title" i]',
    'input[placeholder*="What" i]',
    'label:has-text("Title") + input',
    'label:has-text("Title") ~ input',
    '[role="dialog"] input[type="text"]',
  ], item.title, 'title');

  await safeFill(page, [
    'input[placeholder*="price" i]',
    'input[type="number"]',
    'label:has-text("Price") + input',
    'label:has-text("Price") ~ input',
  ], String(item.price), 'price');

  const fullDesc = await getPlatformDescription(item, 'facebook_marketplace');
  await safeFill(page, [
    'textarea[placeholder*="description" i]',
    'textarea[placeholder*="Describe" i]',
    'label:has-text("Description") + textarea',
    'label:has-text("Description") ~ textarea',
    '[role="dialog"] textarea',
  ], fullDesc, 'description');

  const categoryValue = mapFacebookCategory(item.category);
  await safeClick(page, [
    `text="${categoryValue}"`,
    `div[role="button"]:has-text("${categoryValue}")`,
    'span:has-text("Clothing")',
    'span:has-text("Shoes")',
    'span:has-text("Accessories")',
  ], 'category');

  const conditionLabel = mapFacebookCondition(item.condition);
  if (conditionLabel) {
    await safeClick(page, [
      `text="${conditionLabel}"`,
      `span:has-text("${conditionLabel}")`,
    ], 'condition');
  }

  if (settings['location']) {
    await safeFill(page, [
      'input[placeholder*="location" i]',
      'input[placeholder*="City" i]',
      'label:has-text("Location") + input',
      'label:has-text("Location") ~ input',
    ], settings['location'], 'location');
    await humanDelay(page, 800, 1500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  }

  const submitted = await safeClick(page, [
    'button[type="submit"]',
    'div[role="button"]:has-text("Next")',
    'div[role="button"]:has-text("Publish")',
    'span:has-text("Post")',
    'div[aria-label*="Publish" i]',
    'div[aria-label*="Post" i]',
  ], 'submit');

  if (!submitted) {
    throw new Error('Could not find submit button on Facebook Marketplace');
  }

  await page.waitForTimeout(5000);

  const currentUrl = page.url();
  if (currentUrl.includes('checkpoint') || currentUrl.includes('captcha') || currentUrl.includes('challenge')) {
    throw new Error('Facebook security check (CAPTCHA) detected. Please log in manually and try again.');
  }

  if (currentUrl.includes('/marketplace/') && !currentUrl.includes('/create/')) {
    return currentUrl;
  }

  try {
    const successText = await page.locator('text=/posted|published|success/i').count();
    if (successText > 0) {
      return 'https://www.facebook.com/marketplace';
    }
  } catch { /* ignore */ }

  throw new Error('Facebook submission did not navigate to confirmation page');
}

// ─── Yaga ─────────────────────────────────────────────────────────────────

async function postToYaga(page: Page, item: ItemData, settings: Record<string, string>): Promise<string | null> {
  await page.goto('https://yaga.co.za/sell');
  await page.waitForTimeout(3000);

  if (await isLoginPage(page)) {
    throw new Error('Yaga login required. Please authenticate via Settings > Platform Authentication.');
  }

  for (const photo of item.photos.slice(0, 5)) {
    const photoPath = await downloadPhoto(photo);
    await safeUpload(page, [
      'input[type="file"]',
      'input[accept*="image"]',
    ], photoPath, 'photo');
    await humanDelay(page, 2000, 3000);
  }

  await safeFill(page, [
    'input[name="title"]',
    'input[placeholder*="title" i]',
    'input[placeholder*="What" i]',
    'label:has-text("Title") input',
  ], item.title, 'title');

  await safeFill(page, [
    'input[name="price"]',
    'input[placeholder*="price" i]',
    'input[placeholder*="R" i]',
    'label:has-text("Price") input',
  ], String(item.price), 'price');

  const fullDesc = await getPlatformDescription(item, 'yaga');
  await safeFill(page, [
    'textarea[name="description"]',
    'textarea[placeholder*="description" i]',
    'textarea[placeholder*="Tell" i]',
    'label:has-text("Description") textarea',
  ], fullDesc, 'description');

  const yagaCategory = mapYagaCategory(item.category);
  if (yagaCategory) {
    await safeClick(page, [
      `text="${yagaCategory}"`,
      `span:has-text("${yagaCategory}")`,
    ], 'category');
  }

  if (item.brand) {
    await safeFill(page, [
      'input[name="brand"]',
      'input[placeholder*="brand" i]',
      'label:has-text("Brand") input',
    ], item.brand, 'brand');
  }

  await safeFill(page, [
    'input[name="size"]',
    'input[placeholder*="size" i]',
    'label:has-text("Size") input',
  ], item.size, 'size');

  const yagaCondition = mapYagaCondition(item.condition);
  if (yagaCondition) {
    await safeClick(page, [
      `text="${yagaCondition}"`,
      `span:has-text("${yagaCondition}")`,
    ], 'condition');
  }

  if (item.color) {
    await safeFill(page, [
      'input[name="color"]',
      'input[placeholder*="color" i]',
      'label:has-text("Color") input',
    ], item.color, 'color');
  }

  const submitted = await safeClick(page, [
    'button[type="submit"]',
    'button:has-text("Publish")',
    'button:has-text("Post")',
    'button:has-text("Sell")',
    'button:has-text("Submit")',
  ], 'submit');

  if (!submitted) {
    throw new Error('Could not find submit button on Yaga');
  }

  await page.waitForTimeout(5000);
  const currentUrl = page.url();
  if (currentUrl.includes('/item/') || currentUrl.includes('/listing/')) {
    return currentUrl;
  }

  try {
    const success = await page.locator('text=/posted|published|success|live/i').count();
    if (success > 0) return 'https://yaga.co.za';
  } catch { /* ignore */ }

  throw new Error('Yaga submission did not navigate to confirmation page');
}

// ─── Gumtree ──────────────────────────────────────────────────────────────

async function postToGumtree(page: Page, item: ItemData, settings: Record<string, string>): Promise<string | null> {
  await page.goto('https://www.gumtree.co.za/postad');
  await page.waitForTimeout(3000);

  if (await isLoginPage(page)) {
    throw new Error('Gumtree login required. Please authenticate via Settings > Platform Authentication.');
  }

  const gumtreeCategory = mapGumtreeCategory(item.category);
  if (gumtreeCategory) {
    await safeClick(page, [
      `text="${gumtreeCategory}"`,
      `a:has-text("${gumtreeCategory}")`,
      'span:has-text("Clothing")',
      'span:has-text("Accessories")',
    ], 'category');
    await humanDelay(page, 1500, 2500);
  }

  await safeFill(page, [
    'input[name="title"]',
    'input[id*="title" i]',
    'input[placeholder*="title" i]',
    'label:has-text("Title") input',
  ], item.title, 'title');

  await safeFill(page, [
    'input[name="price"]',
    'input[id*="price" i]',
    'input[placeholder*="price" i]',
    'input[type="number"]',
    'label:has-text("Price") input',
  ], String(item.price), 'price');

  const fullDesc = await getPlatformDescription(item, 'gumtree');
  await safeFill(page, [
    'textarea[name="description"]',
    'textarea[id*="description" i]',
    'textarea[placeholder*="description" i]',
    'label:has-text("Description") textarea',
  ], fullDesc, 'description');

  for (const photo of item.photos.slice(0, 8)) {
    const photoPath = await downloadPhoto(photo);
    await safeUpload(page, [
      'input[type="file"]',
      'input[accept*="image"]',
    ], photoPath, 'photo');
    await humanDelay(page, 1500, 2500);
  }

  if (settings['location']) {
    await safeFill(page, [
      'input[name="location"]',
      'input[id*="location" i]',
      'input[placeholder*="location" i]',
      'input[placeholder*="city" i]',
      'label:has-text("Location") input',
    ], settings['location'], 'location');
  }

  if (settings['gumtree_email']) {
    await safeFill(page, [
      'input[type="email"]',
      'input[name="email"]',
      'input[id*="email" i]',
      'label:has-text("Email") input',
    ], settings['gumtree_email'], 'email');
  }

  const submitted = await safeClick(page, [
    'button[type="submit"]',
    'button:has-text("Post")',
    'button:has-text("Publish")',
    'button:has-text("Submit")',
    'input[type="submit"]',
  ], 'submit');

  if (!submitted) {
    throw new Error('Could not find submit button on Gumtree');
  }

  await page.waitForTimeout(5000);
  const currentUrl = page.url();
  if (currentUrl.includes('/my ads') || currentUrl.includes('/my-ads') || currentUrl.includes('/ad/')) {
    return currentUrl;
  }

  try {
    const success = await page.locator('text=/posted|published|success|live|ad submitted/i').count();
    if (success > 0) return 'https://www.gumtree.co.za';
  } catch { /* ignore */ }

  throw new Error('Gumtree submission did not navigate to confirmation page');
}

// ─── OLX ───────────────────────────────────────────────────────────────────

async function postToOlx(page: Page, item: ItemData, settings: Record<string, string>): Promise<string | null> {
  await page.goto('https://www.olx.co.za/post-ad');
  await page.waitForTimeout(3000);

  if (await isLoginPage(page)) {
    throw new Error('OLX login required. Please authenticate via Settings > Platform Authentication.');
  }

  const olxCategory = mapOlxCategory(item.category);
  if (olxCategory) {
    await safeClick(page, [
      `text="${olxCategory}"`,
      `a:has-text("${olxCategory}")`,
      'span:has-text("Clothes")',
      'span:has-text("Fashion")',
    ], 'category');
    await humanDelay(page, 1500, 2500);
  }

  await safeFill(page, [
    'input[name="title"]',
    'input[id*="title" i]',
    'input[placeholder*="title" i]',
    'label:has-text("Title") input',
  ], item.title, 'title');

  await safeFill(page, [
    'input[name="price"]',
    'input[id*="price" i]',
    'input[placeholder*="price" i]',
    'input[type="number"]',
    'label:has-text("Price") input',
  ], String(item.price), 'price');

  const fullDesc = await getPlatformDescription(item, 'olx');
  await safeFill(page, [
    'textarea[name="description"]',
    'textarea[id*="description" i]',
    'textarea[placeholder*="description" i]',
    'label:has-text("Description") textarea',
  ], fullDesc, 'description');

  for (const photo of item.photos.slice(0, 8)) {
    const photoPath = await downloadPhoto(photo);
    await safeUpload(page, [
      'input[type="file"]',
      'input[accept*="image"]',
    ], photoPath, 'photo');
    await humanDelay(page, 1500, 2500);
  }

  if (settings['location']) {
    await safeFill(page, [
      'input[name="location"]',
      'input[id*="location" i]',
      'input[placeholder*="location" i]',
      'label:has-text("Location") input',
    ], settings['location'], 'location');
    await humanDelay(page, 800, 1500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  }

  if (settings['olx_email']) {
    await safeFill(page, [
      'input[type="email"]',
      'input[name="email"]',
      'input[id*="email" i]',
      'label:has-text("Email") input',
    ], settings['olx_email'], 'email');
  }

  const submitted = await safeClick(page, [
    'button[type="submit"]',
    'button:has-text("Post")',
    'button:has-text("Publish")',
    'button:has-text("Submit")',
    'input[type="submit"]',
  ], 'submit');

  if (!submitted) {
    throw new Error('Could not find submit button on OLX');
  }

  await page.waitForTimeout(5000);
  const currentUrl = page.url();
  if (currentUrl.includes('/ad/') || currentUrl.includes('/myads')) {
    return currentUrl;
  }

  try {
    const success = await page.locator('text=/posted|published|success|live|ad submitted/i').count();
    if (success > 0) return 'https://www.olx.co.za';
  } catch { /* ignore */ }

  throw new Error('OLX submission did not navigate to confirmation page');
}

// ─── Junk Mail ─────────────────────────────────────────────────────────────

async function postToJunkMail(page: Page, item: ItemData, settings: Record<string, string>): Promise<string | null> {
  await page.goto('https://www.junkmail.co.za/post-ad');
  await page.waitForTimeout(3000);

  if (await isLoginPage(page)) {
    throw new Error('Junk Mail login required. Please authenticate via Settings > Platform Authentication.');
  }

  const junkmailCategory = mapJunkmailCategory(item.category);
  if (junkmailCategory) {
    await safeClick(page, [
      `text="${junkmailCategory}"`,
      `a:has-text("${junkmailCategory}")`,
      'span:has-text("Clothing")',
      'span:has-text("Fashion")',
    ], 'category');
    await humanDelay(page, 1500, 2500);
  }

  await safeFill(page, [
    'input[name="title"]',
    'input[id*="title" i]',
    'input[placeholder*="title" i]',
    'label:has-text("Title") input',
  ], item.title, 'title');

  await safeFill(page, [
    'input[name="price"]',
    'input[id*="price" i]',
    'input[placeholder*="price" i]',
    'input[type="number"]',
    'label:has-text("Price") input',
  ], String(item.price), 'price');

  const fullDesc = await getPlatformDescription(item, 'junkmail');
  await safeFill(page, [
    'textarea[name="description"]',
    'textarea[id*="description" i]',
    'textarea[placeholder*="description" i]',
    'label:has-text("Description") textarea',
  ], fullDesc, 'description');

  for (const photo of item.photos.slice(0, 6)) {
    const photoPath = await downloadPhoto(photo);
    await safeUpload(page, [
      'input[type="file"]',
      'input[accept*="image"]',
    ], photoPath, 'photo');
    await humanDelay(page, 1500, 2500);
  }

  if (settings['location']) {
    await safeFill(page, [
      'input[name="location"]',
      'input[id*="location" i]',
      'input[placeholder*="location" i]',
      'label:has-text("Location") input',
    ], settings['location'], 'location');
  }

  if (settings['junkmail_email']) {
    await safeFill(page, [
      'input[type="email"]',
      'input[name="email"]',
      'input[id*="email" i]',
      'label:has-text("Email") input',
    ], settings['junkmail_email'], 'email');
  }

  const submitted = await safeClick(page, [
    'button[type="submit"]',
    'button:has-text("Post")',
    'button:has-text("Publish")',
    'button:has-text("Submit")',
    'input[type="submit"]',
  ], 'submit');

  if (!submitted) {
    throw new Error('Could not find submit button on Junk Mail');
  }

  await page.waitForTimeout(5000);
  const currentUrl = page.url();
  if (currentUrl.includes('/ad/') || currentUrl.includes('/my-ads')) {
    return currentUrl;
  }

  try {
    const success = await page.locator('text=/posted|published|success|live|ad submitted/i').count();
    if (success > 0) return 'https://www.junkmail.co.za';
  } catch { /* ignore */ }

  throw new Error('Junk Mail submission did not navigate to confirmation page');
}

// ─── Mappings ───────────────────────────────────────────────────────────────

async function getPlatformDescription(item: ItemData, platformId: string): Promise<string> {
  const base = buildFullDescription(item);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return base;

  const toneGuides: Record<string, string> = {
    facebook_marketplace: 'casual, friendly, conversational, use emojis sparingly',
    yaga: 'trendy, youthful, fashion-forward, Gen-Z friendly, use hashtags',
    gumtree: 'straightforward, factual, no fluff, clear bullet points preferred',
    olx: 'direct, price-focused, minimal, practical',
    junkmail: 'honest, simple, community-focused',
  };

  const tone = toneGuides[platformId];
  if (!tone) return base;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert copywriter for South African online marketplaces. Rewrite the product description to match this tone: ${tone}. Keep all factual details (size, condition, brand, color) but adjust the tone. Keep under 200 words. Return only the rewritten description text, no explanation.`,
          },
          {
            role: 'user',
            content: `Rewrite this clothing listing description:\n\nTitle: ${item.title}\nDescription: ${base}\n\nReturn only the rewritten description.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const json = await response.json();
    const result = json.choices?.[0]?.message?.content?.trim();
    if (result) {
      console.log(`AI description rewritten for ${platformId}`);
      return result;
    }
  } catch (err) {
    console.warn(`AI description rewrite failed for ${platformId}:`, err);
  }

  return base;
}

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

// ─── Platform Authentication ───────────────────────────────────────────────

export interface AuthSession {
  sessionId: string;
  liveViewUrl: string | null;
}

export async function startPlatformAuth(userId: string, platform: string): Promise<AuthSession> {
  if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID) {
    throw new Error('BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID are required for platform authentication.');
  }

  const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });
  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    proxies: true,
    ...(process.env.BROWSERBASE_STEALTH === 'true' ? { stealth: true } : {}),
  });

  const browser = await chromium.connectOverCDP(session.connectUrl);
  const context = browser.contexts()[0] || await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const platformUrl = SA_PLATFORMS.find(p => p.id === platform)?.url;
  if (platformUrl) {
    await page.goto(platformUrl);
  }

  return {
    sessionId: session.id,
    liveViewUrl: (session as any).liveViewUrl || null,
  };
}

export async function savePlatformAuth(userId: string, platform: string, sessionId: string) {
  if (!process.env.BROWSERBASE_API_KEY) {
    throw new Error('BROWSERBASE_API_KEY is required.');
  }

  const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });

  try {
    const session = await bb.sessions.retrieve(sessionId);
    if (!session.connectUrl) {
      throw new Error('Browser session has no connect URL');
    }
    const browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0];

    if (context) {
      const cookies = await context.cookies();
      if (cookies.length > 0) {
        await saveCookies(userId, platform, cookies);
      }
      await browser.close();
    }
  } catch (err) {
    console.error('Failed to save platform auth:', err);
    throw new Error('Failed to capture cookies from browser session. Please try again.');
  }
}

