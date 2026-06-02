import React from 'react';

const TermsConditionsPage = () => {
    return (
        <div className="bg-white min-h-screen text-black py-12 px-4 md:px-8 lg:px-24">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-extrabold mb-8 border-b-2 border-gray-100 pb-4">Terms and Conditions</h1>

                <section className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-4">1. Introduction</h2>
                    <p className="mb-4 text-gray-700 leading-relaxed">
                        Welcome to <strong>Rohtak Milk Company</strong>. These terms and conditions outline the rules and regulations for the use of Rohtak Milk Company's Website, located at rohtakmilkcompany.in.
                    </p>
                    <p className="mb-4 text-gray-700 leading-relaxed">
                        By accessing this website we assume you accept these terms and conditions. Do not continue to use Rohtak Milk Company if you do not agree to take all of the terms and conditions stated on this page.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-4">2. Intellectual Property Rights</h2>
                    <p className="mb-4 text-gray-700 leading-relaxed">
                        Other than the content you own, under these Terms, Rohtak Milk Company and/or its licensors own all the intellectual property rights and materials contained in this Website.
                    </p>
                    <p className="mb-4 text-gray-700 leading-relaxed">
                        You are granted limited license only for purposes of viewing the material contained on this Website.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-4">3. Restrictions</h2>
                    <p className="mb-4 text-gray-700 leading-relaxed">You are specifically restricted from all of the following:</p>
                    <ul className="list-disc pl-6 space-y-2 text-gray-700">
                        <li>Publishing any Website material in any other media;</li>
                        <li>Selling, sublicensing and/or otherwise commercializing any Website material;</li>
                        <li>Publicly performing and/or showing any Website material;</li>
                        <li>Using this Website in any way that is or may be damaging to this Website;</li>
                        <li>Using this Website in any way that impacts user access to this Website.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-4">4. Your Privacy</h2>
                    <p className="text-gray-700 leading-relaxed">
                        Please read our <a href="/privacy" className="text-green-600 hover:underline">Privacy Policy</a>.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-4">5. Disclaimer</h2>
                    <p className="text-gray-700 leading-relaxed">
                        To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
                        <li>Limit or exclude our or your liability for death or personal injury;</li>
                        <li>Limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
                        <li>Limit any of our or your liabilities in any way that is not permitted under applicable law.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-4">6. Governing Law & Jurisdiction</h2>
                    <p className="text-gray-700 leading-relaxed">
                        These Terms will be governed by and interpreted in accordance with the laws of India, and you submit to the non-exclusive jurisdiction of the state and federal courts located in India for the resolution of any disputes.
                    </p>
                </section>

                <p className="text-sm text-gray-500 mt-12 text-center">Last Updated: March 2026</p>
            </div>
        </div>
    );
};

export default TermsConditionsPage;
