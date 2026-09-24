import { Breadcrumbs } from '../components/Breadcrumbs';
import { SEOHelmet } from '../components/SEOHelmet';
import { Sparkles, Zap, Shield, Eye } from 'lucide-react';

export function AboutView() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SEOHelmet
        title="About Online Tools – Our Purpose & Approach"
        description="Learn about Online Tools, our purpose, approach to building simple and useful browser utilities, and our commitment to accuracy and accessibility."
        canonicalPath="/about"
        breadcrumbs={[{ label: 'About', path: '/about' }]}
      />

      {/* 1. Breadcrumb: Home → About */}
      <Breadcrumbs items={[{ label: 'About', path: '/about' }]} />

      {/* 2. Header */}
      <header className="border-b border-[#EDE9FE] pb-5">
        <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#1E1035] tracking-tight">
          About Online Tools
        </h1>
        <p className="mt-2 text-xs sm:text-sm font-sans text-[#6D6582] leading-relaxed max-w-3xl">
          Online Tools is a collection of practical calculators, converters, text tools, and other browser-based utilities designed to make everyday tasks faster and easier.
        </p>
      </header>

      {/* 3. Our Purpose */}
      <section className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 space-y-2.5 shadow-2xs">
        <h2 className="text-base sm:text-lg font-heading font-bold text-[#1E1035]">
          Our Purpose
        </h2>
        <div className="text-xs sm:text-sm font-sans text-[#6D6582] leading-relaxed space-y-2.5">
          <p>
            Online Tools was created with a straightforward mission: to provide practical everyday utilities that help people solve everyday problems quickly and without friction.
          </p>
          <p>
            Whether you are calculating a discount while shopping, estimating loan repayments, finding the exact days between two dates, or formatting a snippet of text, our focus is centered on:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs sm:text-sm font-sans text-[#1E1035]">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" aria-hidden="true" />
              <span>Simple, intuitive tools</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" aria-hidden="true" />
              <span>Clear, uncluttered interfaces</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" aria-hidden="true" />
              <span>Useful, reliable results</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" aria-hidden="true" />
              <span>Easy, direct access with no sign-up</span>
            </li>
            <li className="flex items-center gap-2 sm:col-span-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" aria-hidden="true" />
              <span>Practical solutions for everyday tasks</span>
            </li>
          </ul>
        </div>
      </section>

      {/* 4. Our Approach */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base sm:text-lg font-heading font-bold text-[#1E1035]">
            Our Approach
          </h2>
          <p className="text-xs font-sans text-[#6D6582] mt-0.5">
            Four core principles guide how we design and build each utility on the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 sm:p-4.5 bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mb-2.5 border border-[#DDD6FE]">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-heading font-bold text-[#1E1035]">Simple</h3>
            <p className="text-xs font-sans text-[#6D6582] mt-1 leading-relaxed">
              Tools should be easy to understand and use. We prioritize clean layouts, self-explanatory inputs, and clear labels over unnecessary complexity.
            </p>
          </div>

          <div className="p-4 sm:p-4.5 bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mb-2.5 border border-[#DDD6FE]">
              <Zap className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-heading font-bold text-[#1E1035]">Fast</h3>
            <p className="text-xs font-sans text-[#6D6582] mt-1 leading-relaxed">
              Tools should provide results efficiently without unnecessary interaction. Computations update in real time as inputs are entered.
            </p>
          </div>

          <div className="p-4 sm:p-4.5 bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mb-2.5 border border-[#DDD6FE]">
              <Shield className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-heading font-bold text-[#1E1035]">Private</h3>
            <p className="text-xs font-sans text-[#6D6582] mt-1 leading-relaxed">
              Many tools can process inputs directly in the browser without sending data to a server. We only claim local processing where the actual tool implementation supports it.
            </p>
          </div>

          <div className="p-4 sm:p-4.5 bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mb-2.5 border border-[#DDD6FE]">
              <Eye className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-heading font-bold text-[#1E1035]">Accessible</h3>
            <p className="text-xs font-sans text-[#6D6582] mt-1 leading-relaxed">
              We design with readable typography, clear labels, keyboard-friendly controls, and responsive layouts that adapt smoothly across mobile, tablet, and desktop screens.
            </p>
          </div>
        </div>
      </section>

      {/* 5. How Our Tools Work */}
      <section className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 space-y-2.5 shadow-2xs">
        <h2 className="text-base sm:text-lg font-heading font-bold text-[#1E1035]">
          How Our Tools Work
        </h2>
        <div className="text-xs sm:text-sm font-sans text-[#6D6582] leading-relaxed space-y-2.5">
          <p>
            Different tasks require different technical approaches. Some tools perform calculations directly in the browser using client-side logic, meaning your input data never leaves your device.
          </p>
          <p>
            Other tools may require server-side processing or integration with external services to function properly. The actual data handling always matches the specific implementation and requirements of each individual tool.
          </p>
        </div>
      </section>

      {/* 6. Accuracy */}
      <section className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 space-y-2.5 shadow-2xs">
        <h2 className="text-base sm:text-lg font-heading font-bold text-[#1E1035]">
          Accuracy & Verification
        </h2>
        <div className="text-xs sm:text-sm font-sans text-[#6D6582] leading-relaxed space-y-2.5">
          <p>
            We aim to build tools using established formulas, clear logic, and careful testing. Each calculator and converter includes documentation explaining the formulas and steps used to reach results.
          </p>
          <p className="text-xs font-sans text-[#6D6582] bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl p-3">
            <strong className="text-[#1E1035] font-heading">Please note:</strong> Users should verify results when they are being used for important professional, financial, legal, medical, or other high-stakes decisions. Our tools are provided for general educational and reference purposes.
          </p>
        </div>
      </section>

      {/* 7. Our Commitment */}
      <section className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 space-y-2.5 shadow-2xs">
        <h2 className="text-base sm:text-lg font-heading font-bold text-[#1E1035]">
          Our Commitment
        </h2>
        <div className="text-xs sm:text-sm font-sans text-[#6D6582] leading-relaxed space-y-2">
          <p>
            We are committed to continuous refinement. We evaluate our tools on four simple metrics:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-xs sm:text-sm font-sans text-[#1E1035]">
            <li><strong>Usefulness:</strong> Solving real, recurring everyday tasks effectively.</li>
            <li><strong>Clarity:</strong> Explaining results clearly with formulas and examples.</li>
            <li><strong>Accessibility:</strong> Ensuring comfortable readability and responsive interaction for all users.</li>
            <li><strong>Ongoing Improvement:</strong> Listening to user feedback to refine tools and add helpful new utilities over time.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
