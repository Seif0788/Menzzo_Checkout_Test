import { Page, expect, Locator } from '@playwright/test';
import { attachment } from 'allure-js-commons';

interface YouTubeUIConfig {
    language?: string;
    timeout?: number;
}

export async function CheckYouTubeVideoUI(
    page: Page,
    config: YouTubeUIConfig = {}
) {
    const {
        language = 'fr',
        timeout = 30000
    } = config;

    console.log('\n▶ Checking YouTube video presence & UI branding');

    // ----------------------------------
    // 1️⃣ Video Presence & Visibility
    // ----------------------------------
    const videoSection = page.locator('.review-video').first();

    await expect(videoSection).toBeVisible({ timeout });
    console.log('Video section is visible');
    await videoSection.scrollIntoViewIfNeeded();
    console.log('Video section is scrolled into view');

    await attachment(
        '📍 Video section',
        'Video section is visible and scrolled into view',
        'text/plain'
    );


    const youtubeIframe = videoSection.locator(
        'iframe[src*="youtube.com"], iframe[src*="youtu.be"]'
    ).first();

    await expect(
        youtubeIframe,
        '❌ YouTube iframe not visible in video section'
    ).toBeVisible({ timeout });

    const iframeSrc = await youtubeIframe.getAttribute('src');

    expect(
        iframeSrc,
        '❌ YouTube iframe src is empty'
    ).toBeTruthy();

    await attachment(
        '🎥 YouTube iframe src',
        iframeSrc as string,
        'text/plain'
    );

    console.log('✅ YouTube iframe is present and visible');

    // ----------------------------------
    // 2️⃣ UI & Branding Compliance (UX Rules)
    // ----------------------------------
    const uiRules = [
        'modestbranding=1', // minimal YouTube branding
        'rel=0',             // no related videos
        `hl=${language}`     // correct language
    ];

    for (const rule of uiRules) {
        expect(
            iframeSrc,
            `❌ Missing UI branding rule: ${rule}`
        ).toContain(rule);
    }

    console.log('✅ YouTube UI & branding rules validated');

    // ----------------------------------
    // 3️⃣ Debug snapshot
    // ----------------------------------
    await attachment(
        '🧩 Video section HTML',
        await videoSection.innerHTML(),
        'text/html'
    );

    await attachment(
        '✅ Video UI check passed',
        'Video is visible and respects UI & branding rules',
        'text/plain'
    );

    console.log('✅ Video presence & UI branding check completed');
}
