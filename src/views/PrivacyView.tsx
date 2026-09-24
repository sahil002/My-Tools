import { Breadcrumbs } from '../components/Breadcrumbs';
import { SEOHelmet } from '../components/SEOHelmet';
import { Link } from '../context/RouterContext';
import { SITE_CONFIG } from '../data/siteConfig';

export function PrivacyView() {
  const contactEmail = SITE_CONFIG.privacyContactEmail || SITE_CONFIG.contactEmail;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SEOHelmet
        title="Privacy Policy – Online Tools"
        description="Learn how Online Tools handles data, tool inputs, technical logs, and user privacy across our website and utilities."
        canonicalPath="/privacy-policy"
      />

      {/* 1. Breadcrumb: Home → Privacy Policy */}
      <Breadcrumbs items={[{ label: 'Privacy Policy', path: '/privacy-policy' }]} />

      {/* 2. Header */}
      <header className="border-b border-[#E4E8EF] pb-6">
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#131A2B] tracking-tight">
          Privacy Policy
        </h1>
        <div className="mt-2 text-xs sm:text-sm font-sans text-[#5B6577] flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>Effective Date: {SITE_CONFIG.privacyEffectiveDate}</span>
          <span className="hidden sm:inline" aria-hidden="true">•</span>
          <span>Last Updated: {SITE_CONFIG.privacyLastUpdated}</span>
        </div>
      </header>

      {/* Content Container */}
      <div className="bg-[#FFFFFF] border border-[#E4E8EF] rounded-2xl p-6 sm:p-8 space-y-8 text-sm sm:text-base text-[#5B6577] leading-relaxed shadow-2xs font-sans">
        {/* 3. Introduction */}
        <section aria-labelledby="privacy-intro-heading" className="space-y-3">
          <h2 id="privacy-intro-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            Introduction
          </h2>
          <p>
            This Privacy Policy explains how Online Tools (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the platform&rdquo;) handles information when you visit our website, utilize our calculators and utilities, or communicate with us.
          </p>
          <p>
            We are committed to transparent practices. This policy outlines what data may be processed, how tool inputs operate, the role of hosting logs, and your options regarding your information.
          </p>
        </section>

        {/* 4. Information We Process */}
        <section aria-labelledby="info-processed-heading" className="space-y-4">
          <h2 id="info-processed-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            Information We Process
          </h2>
          <p>
            Depending on how you interact with our website, certain categories of information may be processed:
          </p>
          <div className="space-y-3 pl-1 text-sm font-sans">
            <div>
              <strong className="text-[#131A2B] block font-heading font-semibold">Voluntarily Submitted Contact Information:</strong>
              <span>
                If you choose to submit feedback, report a calculation issue, or suggest a new tool through our Contact form, we collect the details you provide (such as your name, email address, selected reason, and message content) solely to review and respond to your inquiry.
              </span>
            </div>
            <div>
              <strong className="text-[#131A2B] block font-heading font-semibold">Technical and Operational Data:</strong>
              <span>
                When your browser loads our web pages, the underlying hosting and infrastructure systems receive standard technical request details necessary to transmit web files to your device.
              </span>
            </div>
            <div>
              <strong className="text-[#131A2B] block font-heading font-semibold">Local Browser Storage:</strong>
              <span>
                Certain tools may utilize client-side browser storage (such as localStorage or temporary session state) to save in-progress calculations or display preferences locally on your machine.
              </span>
            </div>
          </div>
        </section>

        {/* 5. Tool Input Processing */}
        <section aria-labelledby="tool-processing-heading" className="space-y-3">
          <h2 id="tool-processing-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            Tool Input Processing
          </h2>
          <p>
            Many tools on this platform process inputs directly in the user&apos;s browser using standard client-side JavaScript. In these tools, calculations execute on your device.
          </p>
          <p>
            Where a tool uses server-side processing, an external API, analytics service, or other third-party service, the relevant implementation and/or tool documentation should accurately describe that processing. We do not represent that all future utilities will execute exclusively in the browser.
          </p>
        </section>

        {/* 6. Current Account & Profile Architecture */}
        <section aria-labelledby="no-collect-heading" className="space-y-3">
          <h2 id="no-collect-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            User Accounts and Registration
          </h2>
          <p>
            Under our current architecture, Online Tools does not require user registration, account creation, or login credentials to access any calculator, converter, or guide.
          </p>
          <p>
            We do not maintain user profiles, and we do not request or store sensitive financial account numbers, credit cards, or government identification numbers through our tools.
          </p>
        </section>

        {/* 7. Technical and Security Logs */}
        <section aria-labelledby="tech-logs-heading" className="space-y-3">
          <h2 id="tech-logs-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            Technical Logs &amp; Security
          </h2>
          <p>
            Hosting and security systems may process technical information such as IP address, browser or device information, requested URLs, timestamps, error information, and similar technical data for security, troubleshooting, reliability, and performance purposes.
          </p>
          <p>
            These logs are standard for internet-connected web servers and are used to detect abusive automated traffic, mitigate security threats, and diagnose server malfunctions.
          </p>
        </section>

        {/* 8. Cookies and Local Storage */}
        <section aria-labelledby="cookies-heading" className="space-y-3">
          <h2 id="cookies-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            Cookies and Similar Technologies
          </h2>
          <p>
            The core utilities on this website function without requiring tracking cookies. Essential technical state may be maintained in client-side memory or local browser storage to keep active tools operational while you navigate between pages.
          </p>
          <p>
            You can configure your browser to block or alert you about cookies or delete local storage at any time through your browser settings.
          </p>
        </section>

        {/* 9. Analytics and Advertising */}
        <section aria-labelledby="analytics-ads-heading" className="space-y-3">
          <h2 id="analytics-ads-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            Analytics and Advertising
          </h2>
          <p>
            <strong className="text-[#131A2B]">Current Status:</strong> Our primary directory and tools operate with minimal data collection. Third-party advertising slots on the platform remain inactive unless explicitly enabled in specific deployment configurations.
          </p>
          <p>
            <strong className="text-[#131A2B]">Planned / External Services:</strong> If third-party advertising networks (such as Google AdSense) or analytics services are activated in the future, those third-party providers may use cookies, web beacons, or device identifiers to measure ad performance or analyze aggregate site traffic. Any active third-party services will be subject to their respective privacy disclosures and opt-out controls.
          </p>
        </section>

        {/* 10. Third-Party Services */}
        <section aria-labelledby="third-party-heading" className="space-y-3">
          <h2 id="third-party-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            Third-Party Service Providers
          </h2>
          <p>
            To deliver this website, we may rely on external service providers for:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-sm">
            <li>Cloud hosting, content delivery network (CDN), and reverse-proxy routing infrastructure.</li>
            <li>Web font delivery (e.g., Google Fonts) to render typography in your browser.</li>
            <li>Form dispatch services, if configured by site administrators for contact inquiries.</li>
          </ul>
          <p className="text-xs sm:text-sm text-[#5B6577]">
            These providers process technical network requests solely to fulfill the necessary operational functions of serving website assets and handling network traffic.
          </p>
        </section>

        {/* 11. Data Retention */}
        <section aria-labelledby="retention-heading" className="space-y-3">
          <h2 id="retention-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            Data Retention
          </h2>
          <p>
            Information voluntarily submitted through our Contact form is retained only as long as necessary to address your feedback, investigate reported calculation bugs, or maintain records of editorial communications.
          </p>
          <p>
            Server operational logs maintained by hosting infrastructure providers are retained in accordance with the hosting platform&apos;s standard logging retention cycles.
          </p>
        </section>

        {/* 12. User Rights */}
        <section aria-labelledby="user-rights-heading" className="space-y-3">
          <h2 id="user-rights-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            Your Privacy Rights
          </h2>
          <p>
            Depending on your jurisdiction, you may have rights under applicable data protection laws regarding personal information you have voluntarily provided to us. These may include the right to request access to, correction of, or deletion of your communication records.
          </p>
          <p>
            Because we do not require accounts or store calculation sessions on a central database, most user activity on our platform is tied solely to your local browser environment.
          </p>
        </section>

        {/* 13. Children's Privacy */}
        <section aria-labelledby="children-privacy-heading" className="space-y-3">
          <h2 id="children-privacy-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            Children&apos;s Privacy
          </h2>
          <p>
            Online Tools is designed as a general-audience educational and practical resource. We do not knowingly collect or solicit personal identifiable information from children under the age of 13. If you believe a child has submitted personal details through our Contact form, please notify us so we can promptly remove the record.
          </p>
        </section>

        {/* 14. Policy Updates */}
        <section aria-labelledby="updates-heading" className="space-y-3">
          <h2 id="updates-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our tool implementations, infrastructure updates, or legal requirements. When updates are published, the &ldquo;Last Updated&rdquo; date at the top of this page will be revised accordingly.
          </p>
        </section>

        {/* 15. Contact */}
        <section aria-labelledby="privacy-contact-heading" className="space-y-3 border-t border-[#E4E8EF] pt-6">
          <h2 id="privacy-contact-heading" className="text-lg font-heading font-bold text-[#131A2B]">
            Contact Us Regarding Privacy
          </h2>
          {contactEmail ? (
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, you can contact us by email at{' '}
              <a
                href={`mailto:${contactEmail}`}
                className="text-[#2563EB] font-heading font-semibold underline hover:text-[#1D4ED8]"
              >
                {contactEmail}
              </a>{' '}
              or submit a message via our{' '}
              <Link href="/contact" className="text-[#2563EB] font-heading font-semibold underline hover:text-[#1D4ED8]">
                Contact page
              </Link>.
            </p>
          ) : (
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please send us a message via our{' '}
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
