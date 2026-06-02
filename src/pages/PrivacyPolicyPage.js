import React from 'react';

const PrivacyPolicyPage = () => {
    return (
        <div className="bg-white min-h-screen text-black py-12 px-4 md:px-8 lg:px-24">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-extrabold mb-8 border-b-2 border-gray-100 pb-4">Privacy Policy</h1>

                <p className="mb-6 text-gray-700 leading-relaxed">
                    At <strong>Rohtak Milk Company</strong>, accessible from rohtakmilkcompany.in, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Rohtak Milk Company and how we use it.
                </p>

                <section className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-4">1. Information We Collect</h2>
                    <p className="mb-4 text-gray-700 leading-relaxed">
                        The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-gray-700">
                        <li><strong>Account Information:</strong> When you register for an Account, we may ask for your contact information, including items such as name, email address, and telephone number.</li>
                        <li><strong>Order Information:</strong> If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-4">2. How We Use Your Information</h2>
                    <p className="mb-4 text-gray-700 leading-relaxed">We use the information we collect in various ways, including to:</p>
                    <ul className="list-disc pl-6 space-y-2 text-gray-700">
                        <li>Provide, operate, and maintain our website.</li>
                        <li>Improve, personalize, and expand our website.</li>
                        <li>Understand and analyze how you use our website.</li>
                        <li>Develop new products, services, features, and functionality.</li>
                        <li>Communicate with you, either directly or through one of our partners.</li>
                        <li>Process your transactions and send you related information.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-4">3. Log Files</h2>
                    <p className="text-gray-700 leading-relaxed">
                        Rohtak Milk Company follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-4">4. Cookies and Web Beacons</h2>
                    <p className="text-gray-700 leading-relaxed">
                        Like any other website, Rohtak Milk Company uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-4">5. Contact Us</h2>
                    <p className="text-gray-700 leading-relaxed">
                        If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at <strong>rohtakmilkcompany@gmail.com</strong>.
                    </p>
                </section>

                <p className="text-sm text-gray-500 mt-12 text-center">Last Updated: March 2026</p>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
