// frontend/src/i18n/content/privacy.en.js


export default {
  lastUpdate: '13 September 2026',

  introLead: '<p>At <strong>Mukhtabir</strong>, we take your privacy seriously. This policy explains how we collect, use, and protect your personal data when you use our educational system. Please read it carefully to understand our practices regarding your data.</p>',

  sections: [
    {
      id: 'overview',
      num: 1,
      icon: 'bi bi-info-circle',
      title: 'Overview',
      content: `<p>This privacy policy applies to every user who accesses the <strong>Mukhtabir</strong> educational system. By signing in and using the system, you explicitly agree to the collection and use of your personal data under the terms set out in this policy.</p>
    <p>We are committed to protecting your privacy and to keeping your personal data safe. This policy is designed to clarify:</p>
    <ul>
      <li>What data we collect and why</li>
      <li>How we use and protect your data</li>
      <li>Your rights with respect to your personal data</li>
      <li>How you can reach us about privacy concerns</li>
    </ul>
    <h4>1.1 Legal basis for processing</h4>
    <p>We process your personal data on the following grounds:</p>
    <ul>
      <li><strong>Performance of a contract:</strong> to create your account, operate the system, and deliver the educational service.</li>
      <li><strong>Legal obligation:</strong> to comply with the laws and regulations in force in Syria.</li>
      <li><strong>Explicit consent:</strong> for sensitive data or optional purposes, we request your explicit and separate consent.</li>
      <li><strong>Legitimate interest:</strong> to improve the system, ensure its security, and prevent misuse.</li>
    </ul>
    <blockquote>
      <p><strong>ℹ️ Legal note:</strong> this system is subject to Syrian Law No. 12 of 2024 on the Protection of Electronic Personal Data, which came into force on 1 January 2025. That law classifies sensitive personal data in a special category that requires explicit consent and additional protection measures. We seek to comply with this law within the limits of our available means and resources. For the international framework, we are guided by the principles of the EU General Data Protection Regulation (GDPR) where possible.</p>
    </blockquote>`
    },

    {
      id: 'data-collection',
      num: 2,
      icon: 'bi bi-collection',
      title: 'Data we collect',
      content: `<h4>2.1 Account data</h4>
    <p>When you create your account or sign in, we collect the following:</p>
    <table class="table-shared">
      <thead>
        <tr><th>Data</th><th>Description</th><th>Required</th></tr>
      </thead>
      <tbody>
        <tr><td>Username</td><td>Unique identifier for sign-in</td><td>✅ Yes</td></tr>
        <tr><td>Password</td><td>Hashed using PBKDF2-SHA256</td><td>✅ Yes</td></tr>
        <tr><td>Full name</td><td>Shown on your profile</td><td>❌ Optional</td></tr>
        <tr><td>Email</td><td>For contact and notifications</td><td>❌ Optional</td></tr>
        <tr><td>Role</td><td>Admin or doctor</td><td>✅ Yes</td></tr>
      </tbody>
    </table>
    <h4>2.2 Usage data</h4>
    <p>We automatically collect the following while you use the system:</p>
    <ul>
      <li><strong>IP address:</strong> to track sessions and prevent misuse</li>
      <li><strong>Activity log:</strong> sign-in and sign-out times</li>
      <li><strong>Browser data:</strong> browser type and version (User-Agent)</li>
      <li><strong>Session identifier:</strong> to maintain your sign-in state</li>
      <li><strong>Theme preference:</strong> your preferred visual appearance</li>
    </ul>
    <h4>2.3 Content data</h4>
    <p>We store the data you create inside the system:</p>
    <ul>
      <li>Questions you add or edit</li>
      <li>Your test answers and results</li>
      <li>Bookmarked questions you save</li>
      <li>Reports you file against questions</li>
      <li>Verification notes you add</li>
    </ul>
    <h4>2.4 Sensitive data</h4>
    <p>Mukhtabir is an educational medical-quiz application, not an electronic medical-records (EMR) system. Nonetheless, some of the data we collect may be personal or educational information that is considered sensitive under Syrian Law No. 12 of 2024, such as:</p>
    <ul>
      <li>Test results that may reflect your knowledge or medical level</li>
      <li>Questions you author in the medical field</li>
      <li>Verification notes tied to evaluating medical content</li>
    </ul>
    <p>We handle this data with additional protection and request your explicit and separate consent when processing it.</p>`
    },

    {
      id: 'data-usage',
      num: 3,
      icon: 'bi bi-gear',
      title: 'How we use your data',
      content: `<p>We use your personal data only for the following purposes:</p>
    <h4>3.1 Operating the system</h4>
    <ul>
      <li>Signing you in and keeping your session alive</li>
      <li>Personalizing your experience based on your preferences</li>
      <li>Displaying your questions and results</li>
      <li>Saving your test progress</li>
    </ul>
    <h4>3.2 Security and protection</h4>
    <ul>
      <li>Preventing unauthorized access to your account</li>
      <li>Detecting and preventing intrusion attempts</li>
      <li>Rate-limiting failed sign-in attempts</li>
      <li>Locking accounts after repeated failures</li>
    </ul>
    <h4>3.3 Improvement and development</h4>
    <ul>
      <li>Analyzing usage patterns to improve the interface</li>
      <li>Identifying and fixing bugs</li>
      <li>Developing new features based on needs</li>
    </ul>
    <h4>3.4 Administration</h4>
    <ul>
      <li>Managing user permissions</li>
      <li>Renewing expired subscriptions</li>
      <li>Sending important administrative notices</li>
    </ul>
    <blockquote>
      <p><strong>⚠️ Important:</strong> we do not sell your personally identifying data to any third party, and we do not share it with external parties except where required by law or with your explicit consent. However, we may sell fully anonymized data (after all personal identifiers have been removed) for statistical, research, or commercial purposes.</p>
    </blockquote>`
    },

    {
      id: 'data-storage',
      num: 4,
      icon: 'bi bi-database',
      title: 'Storage and protection',
      content: `<h4>4.1 Where data is stored</h4>
    <p>All data is stored in a local database on an internal server. Data does not leave the local network except for external backups made by authorized administrators.</p>
    <h4>4.2 Security measures</h4>
    <p>We apply multiple security measures to protect your data:</p>
    <table class="table-shared">
      <thead>
        <tr><th>Measure</th><th>Description</th></tr>
      </thead>
      <tbody>
        <tr><td>Password hashing</td><td>All passwords are hashed using PBKDF2-SHA256 with a unique salt</td></tr>
        <tr><td>CSRF protection</td><td>All requests are protected with CSRF tokens to prevent forgery</td></tr>
        <tr><td>Secure cookies</td><td>HttpOnly and SameSite=Lax to mitigate XSS</td></tr>
        <tr><td>Rate limiting</td><td>At most 5 sign-in attempts per minute</td></tr>
        <tr><td>Account lockout</td><td>Automatic 15-minute lock after 5 failed attempts</td></tr>
        <tr><td>Secure sessions</td><td>15-day session lifetime with automatic renewal</td></tr>
        <tr><td>Access logging</td><td>Sensitive data accesses are logged for review</td></tr>
      </tbody>
    </table>
    <h4>4.3 Limits of our security responsibility</h4>
    <blockquote>
      <p><strong>⚠️ Notice:</strong> we do our best to protect your data, but we are not professional cybersecurity experts and cannot guarantee absolute security. We are not responsible for any breach or data loss outside our reasonable control. We recommend that users take their own precautions and avoid sharing unnecessary sensitive data. No electronic system is 100% secure.</p>
    </blockquote>
    <h4>4.4 Backups</h4>
    <p>The system can create database backups. These are stored locally on the same server. Administrators are advised to download backups periodically and keep them in a safe external location to protect the data against server failure.</p>`
    },

    {
      id: 'cookies',
      num: 5,
      icon: 'bi bi-cookie',
      title: 'Cookies',
      content: `<h4>5.1 What are cookies?</h4>
    <p>Cookies are small text files stored on your device when you visit a website. We use them to keep your sign-in state and preferences.</p>
    <h4>5.2 The cookies we use</h4>
    <p>We use a limited set of cookies and similar tags, mainly:</p>
    <ul>
      <li><strong>Session cookies:</strong> to keep you signed in.</li>
      <li><strong>Protection cookies:</strong> to prevent request-forgery (CSRF) attacks.</li>
      <li><strong>Preference cookies:</strong> to store your local settings (such as the visual theme).</li>
    </ul>
    <p>We do not use cookies for tracking, advertising, or marketing analytics.</p>
    <h4>5.3 Local storage</h4>
    <p>We use browser local storage to keep:</p>
    <ul>
      <li>Your preferred visual theme (light / dark / blossom / fresh)</li>
      <li>Your user preferences (default question count, etc.)</li>
      <li>Questions you viewed recently</li>
    </ul>
    <p>This data is kept locally on your device and is not sent to the server. You can clear it at any time from your browser settings.</p>
    <h4>5.4 No tracking pixels</h4>
    <p>We do not use cookies for tracking or advertising. We do not track your behavior across other websites and do not share your data with advertising networks.</p>`
    },

    {
      id: 'user-rights',
      num: 6,
      icon: 'bi bi-person-check',
      title: 'Your rights',
      content: `<p>You have the following rights with respect to your personal data:</p>
    <h4>6.1 Right of access</h4>
    <p>You may request a copy of all personal data we hold about you. Most of your data is visible directly from the <strong>Profile</strong> page.</p>
    <h4>6.2 Right to rectification</h4>
    <p>You may request correction of any inaccurate or incomplete data. You can update:</p>
    <ul>
      <li>Your full name from the Profile page</li>
      <li>Your password from the Change Password page</li>
      <li>Your preferences from the Settings page</li>
    </ul>
    <h4>6.3 Right to erasure</h4>
    <p>You may request deletion of your account and all data associated with it. Please note:</p>
    <ul>
      <li>Deleting the account requires administrator intervention</li>
      <li>Questions you authored will remain in the system (with your name hidden)</li>
      <li>Deletion cannot be undone once performed</li>
    </ul>
    <h4>6.4 Right to object</h4>
    <p>You may object to processing of your data in certain cases, such as using it for purposes beyond the core operation of the system.</p>
    <h4>6.5 Right to withdraw consent</h4>
    <p>You may withdraw your consent to processing at any time. Withdrawing stops future processing but does not affect the lawfulness of past processing. To withdraw consent, contact the system administrator.</p>
    <h4>6.6 Right not to be subject to automated decisions</h4>
    <p>You have the right not to be subject to automated decisions that significantly affect you, such as automatic account refusal or access restriction based on your activity. You may request human review of any automated decision.</p>
    <h4>6.7 Right to data portability</h4>
    <p>You may request a copy of your data in a machine-readable format (JSON). The administrator can export your data on request.</p>
    <h4>6.8 How to exercise your rights</h4>
    <p>To exercise any of your rights, contact the system administrator through the approved internal channels or by email at <strong>hjjarmhmmdali@gmail.com</strong>. We will respond within 30 days at most.</p>
    <blockquote>
      <p><strong>🛡️ Identity verification:</strong> before carrying out sensitive requests (such as account deletion or data export) we may ask you for a national identity document, a video call, or in-person contact to verify your identity. This is to protect you from unauthorized access to your data.</p>
    </blockquote>`
    },

    {
      id: 'data-retention',
      num: 7,
      icon: 'bi bi-clock-history',
      title: 'Data retention',
      content: `<h4>7.1 Account data</h4>
    <p>We may retain your account data indefinitely while the account is active or until it is deleted manually. When the account is deleted:</p>
    <ul>
      <li>All data associated with the account may be deleted</li>
      <li>Questions you authored may remain in the system with the author name hidden</li>
      <li>Deletion cannot be undone</li>
    </ul>
    <h4>7.2 Activity logs</h4>
    <p>We may retain sign-in and activity logs indefinitely for security and review purposes; they may be deleted manually or automatically at the discretion of the system administrator.</p>
    <h4>7.3 Active sessions</h4>
    <p>Inactive sessions are deleted automatically one hour after the last activity.</p>
    <h4>7.4 Sign-in attempts</h4>
    <p>Failed sign-in attempts are retained for 75 minutes (15-minute lock plus a 60-minute buffer) and are then deleted automatically.</p>
    <h4>7.5 Backups</h4>
    <p>Backups created by the administrator remain on the server until manually deleted. Periodic review and removal of old backups is recommended.</p>
    <blockquote>
      <p><strong>ℹ️ Note:</strong> we may retain some data for longer to comply with legal obligations or for security purposes. Once the retention period ends, the data is deleted securely or anonymized.</p>
    </blockquote>`
    },

    {
      id: 'third-party',
      num: 8,
      icon: 'bi bi-people',
      title: 'Third parties and data sharing',
      content: `<h4>8.1 We do not sell your identifying data</h4>
    <p>We do not sell, rent, or trade your personally identifying data with any third party. However, we may sell fully anonymized data (after all personal identifiers have been removed) for statistical or research purposes.</p>
    <h4>8.2 Service providers</h4>
    <p>The system runs locally on an internal server and does not rely on external cloud services to process your data. All processing happens inside the local network. The system is not an EMR and does not process patient records.</p>
    <h4>8.3 Legal requirements</h4>
    <p>We may be required to disclose your data only in the following cases:</p>
    <ul>
      <li>To comply with a valid court order or legal request</li>
      <li>To protect our rights or the safety of users</li>
      <li>To prevent fraud or illegal activity</li>
    </ul>
    <h4>8.4 Data transfer</h4>
    <p>We do not transfer your data outside Syria or outside the local network, except for external backups performed by authorized administrators.</p>`
    },

    {
      id: 'children',
      num: 9,
      icon: 'bi bi-person-hearts',
      title: 'Privacy of minors',
      content: `<p>Mukhtabir is designed for use by physicians and medical trainees and is not aimed at children under the age of 18.</p>
    <p>We do not knowingly collect personal data from children. If you learn that a child has provided us with personal data, please contact us immediately so we can take the appropriate steps and delete that data.</p>
    <blockquote>
      <p><strong>ℹ️ Note:</strong> all accounts are created by the system administrator after verifying the user's identity and medical credentials.</p>
    </blockquote>`
    },

    {
      id: 'security',
      num: 10,
      icon: 'bi bi-shield-lock',
      title: 'Data security',
      content: `<h4>10.1 Our commitment</h4>
    <p>We commit to applying information-security best practices within the limits of our means and resources to protect your data against unauthorized access, alteration, disclosure, or destruction.</p>
    <h4>10.2 Technical measures</h4>
    <ul>
      <li><strong>Encryption:</strong> passwords are hashed; data may be transferred over HTTPS or HTTP depending on deployment settings.</li>
      <li><strong>Authentication:</strong> strong authentication with protection against brute-force attacks</li>
      <li><strong>Access control:</strong> user permissions are role-based</li>
      <li><strong>Logging:</strong> security events and sensitive data accesses are logged for review</li>
      <li><strong>Updates:</strong> libraries and dependencies are kept current</li>
    </ul>
    <h4>10.3 Organizational measures</h4>
    <ul>
      <li>Simplified Data Protection Impact Assessment for high-risk processing</li>
      <li>Access to data is restricted to what is needed</li>
      <li>Staff are made aware of good security practice</li>
      <li>Security measures are reviewed periodically</li>
    </ul>
    <blockquote>
      <p><strong>ℹ️ Note:</strong> Mukhtabir is not an electronic medical-records (EMR) system and does not process patient medical records. Our risk assessment focuses on users' educational and personal data.</p>
    </blockquote>
    <h4>10.4 If a breach occurs</h4>
    <p>If we discover a security breach that affects your data, we will:</p>
    <ul>
      <li>Contain the breach as quickly as possible</li>
      <li>Assess the scope of impact</li>
      <li>Attempt to notify affected users</li>
      <li>Take steps to prevent recurrence</li>
    </ul>
    <blockquote>
      <p><strong>⚠️ Limits of notification:</strong> we regret that we cannot guarantee immediate breach notification in all cases, given our limited resources and experience. We will do our best to handle any security incident, but formal notification may be outside our current capacity. We apologize for any inconvenience this may cause.</p>
    </blockquote>`
    },

    {
      id: 'changes',
      num: 11,
      icon: 'bi bi-pencil-square',
      title: 'Changes to this policy',
      content: `<p>We may update this privacy policy from time to time to keep pace with changes in our practices or in legal requirements.</p>
    <h4>11.1 How we let you know</h4>
    <ul>
      <li>By updating the "last updated" date at the top of this page</li>
      <li>By posting a prominent notice in the system when material changes are made (where feasible)</li>
      <li>By sending an in-app notification to registered users (where available)</li>
    </ul>
    <blockquote>
      <p><strong>⚠️ Notice:</strong> we may change this policy without prior notice. We respect you and do our best to inform you of important changes, but we cannot guarantee prior notification in every case. You may contact us at any time to discuss the policy at <strong>hjjarmhmmdali@gmail.com</strong>. Continuing to use the system after the changes are published constitutes your agreement to the updated policy. If you do not agree with the changes, you must stop using the system and contact the administrator to delete your account.</p>
    </blockquote>
    <h4>11.2 Material changes</h4>
    <p>Material changes include, but are not limited to:</p>
    <ul>
      <li>Collecting new categories of personal data</li>
      <li>Using data for new purposes</li>
      <li>Sharing data with new third parties</li>
      <li>Changing the retention period of data</li>
    </ul>`
    },

    {
      id: 'international',
      num: 12,
      icon: 'bi bi-globe',
      title: 'International users',
      content: `<p>Mukhtabir is designed for use from within Syria. If you use the system from outside Syria, please note:</p>
    <ul>
      <li>Your data will be processed and stored in Syria</li>
      <li>Syrian data-protection laws may differ from those of your country</li>
      <li>By using the system, you consent to the transfer of your data to Syria</li>
    </ul>
    <blockquote>
      <p><strong>ℹ️ Note:</strong> the system runs over the network and requires a connection to the server to access data and process requests. The system cannot be used in fully offline mode.</p>
    </blockquote>`
    }
  ],

  summaryItems: [
    'We collect only the data needed to run the system',
    'We do not sell your personally identifying data to any third party',
    'Passwords are hashed and cannot be read',
    'You have the right to access and delete your data',
    'We do our utmost to protect your data'
  ],

  contactIntro: 'If you have any questions about this privacy policy or our data-handling practices, please contact the system administrator through the approved internal channels or by email at <strong>hjjarmhmmdali@gmail.com</strong>',

  contactItems: [
    { icon: 'bi bi-building', text: 'Mukhtabir team (independent development initiative)' },
    { icon: 'bi bi-person-badge', text: 'System administrator' },
    { icon: 'bi bi-envelope', text: 'hjjarmhmmdali@gmail.com' }
  ],

  footerMain: 'By using the Mukhtabir system, you agree to the terms of this privacy policy.',

  footerDisclaimer: 'This policy is provided "as is" within the limits of our means and resources; we do our best to comply with applicable laws.'
}