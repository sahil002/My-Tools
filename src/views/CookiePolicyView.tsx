import { Breadcrumbs } from '../components/Breadcrumbs';
import { SEOHelmet } from '../components/SEOHelmet';
import { Link } from '../context/RouterContext';
import { SITE_CONFIG } from '../data/siteConfig';

export function CookiePolicyView() {
  const contactEmail = SITE_CONFIG.contactEmail;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SEOHelmet
        title="Cookie Policy – Online Tools"
        description="Learn how Online Tools handles cookies, local storage, and browser technologies across our website and utilities."
        canonicalPath="/cookie-policy"
      />

      {/* 1. Breadcrumb: Home → Cookie Policy */}
      <Breadcrumbs items={[{ label: 'Cookie Policy', path: '/cookie-policy' }]} />

      {/* 2. Header */}
      <header className="border-b border-[#E4E8EF] pb-6">
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#131A2B] tracking-tight">
          Cookie Policy
        </h1>
        <div className="mt-2 text-xs sm:text-sm font-sans text-[#5B6577] flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>Effective Date: {SITE_CONFIG.cookieEffectiveDate}</span>
          <span className="hidden sm:inline" aria-hidden="true">•</span>
          <span>Last Updated: {SITE_CONFIG.cookieLastUpdated}</span>
        </div>
      </header>

      {/* Content Container */}
      <div className="bg-[#FFFFFF] border border-[#E4E8EF] rounded-2xl p-6 sm:p-8 space-y-8 text-sm sm:text-base text-[#5B6577] leading-relaxed shadow-2xs font-sans">
        {/* 3. What Are Cookies? */}
        <section aria-labelledby="what-are-cookies-heading" className="space-y-3">
          <h2 id="what-are-cookies-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            1. What Are Cookies?
          </h2>
          <p>
            Cookies are small text files that web servers place on your computer, tablet, or mobile device when you visit a website. They are widely used across the internet to allow web pages to recognize returning devices, enable core technical navigation, or track interactions across browsing sessions.
          </p>
        </section>

        {/* 4. Cookies We Use */}
        <section aria-labelledby="cookies-used-heading" className="space-y-4">
          <h2 id="cookies-used-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            2. Cookies and Our Website
          </h2>
          <p>
            To provide transparency, we outline how different categories of cookies apply to the current implementation of Online Tools:
          </p>

          <div className="space-y-3 pl-1 text-sm font-sans">
            <div>
              <strong className="text-[#131A2B] block font-heading font-semibold">Essential / Functional Cookies:</strong>
              <span>
                Our platform does not require account login, user authentication, or persistent session cookies to use the calculators, converters, and reference guides. Standard browsing and tool execution operate without setting first-party tracking cookies on your device.
              </span>
            </div>

            <div>
              <strong className="text-[#131A2B] block font-heading font-semibold">Analytics Cookies:</strong>
              <span>
                We do not currently deploy active third-party analytics cookies (such as Google Analytics) to track individual user activity across our pages.
              </span>
            </div>

            <div>
              <strong className="text-[#131A2B] block font-heading font-semibold">Advertising Cookies:</strong>
              <span>
                There are currently no active third-party advertising cookies or ad tags (such as Google AdSense) embedded on the website.
              </span>
            </div>
          </div>
        </section>

        {/* 5. Local Storage and Similar Technologies */}
        <section aria-labelledby="local-storage-heading" className="space-y-3">
          <h2 id="local-storage-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            3. Local Storage and Similar Technologies
          </h2>
          <p>
            Web browsers provide additional storage mechanisms, such as <code className="bg-[#F4F6F9] border border-[#E4E8EF] px-1.5 py-0.5 rounded text-[#131A2B] font-mono">localStorage</code> and <code className="bg-[#F4F6F9] border border-[#E4E8EF] px-1.5 py-0.5 rounded text-[#131A2B] font-mono">sessionStorage</code>, which allow web applications to store key-value data directly on your device rather than transmitting it in HTTP headers.
          </p>
          <p>
            In our current application architecture, calculator inputs, conversion numbers, and text manipulations are processed in temporary browser runtime memory while the page remains open. We do not automatically write your calculation histories, entered values, or selected units into persistent <code className="bg-[#F4F6F9] border border-[#E4E8EF] px-1.5 py-0.5 rounded text-[#131A2B] font-mono">localStorage</code> records. If a future specialized utility requires saving preferences locally, that behavior will be documented directly within the relevant tool.
          </p>
        </section>

        {/* 6. Analytics Practices */}
        <section aria-labelledby="analytics-heading" className="space-y-3">
          <h2 id="analytics-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            4. Web Analytics
          </h2>
          <p>
            Third-party tracking analytics suites, including Google Analytics, are not currently active on this website. Our hosting infrastructure may collect standard, aggregate server metrics (such as page request volume and HTTP status codes) to monitor server health and uptime, but these operational server logs do not rely on browser cookies.
          </p>
        </section>

        {/* 7. Advertising */}
        <section aria-labelledby="advertising-heading" className="space-y-3">
          <h2 id="advertising-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            5. Advertising Technologies
          </h2>
          <p>
            Online Tools does not currently run active third-party advertisements or ad networks. If advertising services (such as Google AdSense) are introduced in the future to support free access, those providers may utilize cookies or web beacons to serve ads based on prior visits. If implemented, this policy will be updated with the specific technologies and opt-out mechanisms.
          </p>
        </section>

        {/* 8. Third-Party Services */}
        <section aria-labelledby="third-party-heading" className="space-y-3">
          <h2 id="third-party-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            6. Third-Party Services
          </h2>
          <p>
            When you visit Online Tools, your browser may establish connections with the following external service providers to load necessary page assets:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-1 text-sm text-[#5B6577]">
            <li>
              <strong className="text-[#131A2B]">Hosting &amp; CDN Infrastructure:</strong> Delivers HTML, JavaScript, and stylesheet files to your browser efficiently.
            </li>
            <li>
              <strong className="text-[#131A2B]">Google Fonts:</strong> Loads typographic font files to display clean, readable text. Google Fonts requests do not set cookies on your device.
            </li>
          </ul>
        </section>

        {/* 9. Managing Cookies */}
        <section aria-labelledby="managing-cookies-heading" className="space-y-3">
          <h2 id="managing-cookies-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            7. Managing Cookies in Your Browser
          </h2>
          <p>
            Most modern web browsers allow you to manage your cookie and storage preferences. You can set your browser to notify you before accepting cookies, reject cookies altogether, or delete stored cookies and site data at any time.
          </p>
          <p>
            Because our calculators, converters, and guides rely on client-side computational scripts rather than tracking cookies, disabling cookies in your browser settings will not prevent you from using the core calculation tools on this website.
          </p>
        </section>

        {/* 10. Policy Changes */}
        <section aria-labelledby="policy-changes-heading" className="space-y-3">
          <h2 id="policy-changes-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            8. Changes to This Policy
          </h2>
          <p>
            We may revise this Cookie Policy as new utilities are developed, technologies change, or legal requirements evolve. When modifications occur, the &ldquo;Last Updated&rdquo; date at the top of this document will be revised accordingly. We encourage you to review this page periodically.
          </p>
        </section>

        {/* 11. Contact */}
        <section aria-labelledby="cookie-contact-heading" className="space-y-3 border-t border-[#E4E8EF] pt-6">
          <h2 id="cookie-contact-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            9. Contact Us
          </h2>
          {contactEmail ? (
            <p>
              If you have questions about our use of cookies or browser storage technologies, please contact us by email at{' '}
              <a
                href={`mailto:${contactEmail}`}
                className="text-[#2563EB] font-heading font-semibold underline hover:text-[#1D4ED8]"
              >
                {contactEmail}
              </a>{' '}
              or submit an inquiry through our{' '}
              <Link href="/contact" className="text-[#2563EB] font-heading font-semibold underline hover:text-[#1D4ED8]">
                Contact page
              </Link>.
            </p>
          ) : (
            <p>
              If you have questions about our use of cookies or browser storage technologies, please reach out via our{' '}
              <Link href="/contact" className="text-[#2563EB] font-heading font-semibold underline hover:text-[#1D4ED8]">
                Contact page
              </Link>.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
