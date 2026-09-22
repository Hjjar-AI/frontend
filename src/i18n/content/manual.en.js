// frontend/src/i18n/content/manual.en.js
//
// User Manual content — English. Shape, constraints, and design notes
// mirror manual.ar.js — see that file for the full rationale.

export default {
  lead: 'Everything you need to know about <strong>Mukhtabir</strong> for managing psychiatry questions and exams. This manual is your sole reference — from your first sign-in to mastering every feature.',

  footerNote: 'You have now mastered <strong>Mukhtabir</strong>. We wish you a fruitful and enjoyable learning experience.',

  sections: [
    {
      id: 'intro',
      num: 1,
      icon: 'bi bi-info-circle',
      title: 'Introduction',
      content: `<h4>What is Mukhtabir?</h4>
    <p><strong>Mukhtabir</strong> is an educational platform specialised in <strong>psychiatry</strong>, designed to help physicians and trainees review and test their knowledge by managing multiple-choice questions and organising them into exams. The system is maintained by a dedicated medical and technical team.</p>
    <h4>Key features</h4>
    <ul>
      <li><strong>Full question management:</strong> add, edit, delete, search, filter, duplicate, and export.</li>
      <li><strong>Two test modes:</strong> exam (timed) and self-study (with immediate explanations and multiple filters).</li>
      <li><strong>Full Markdown support:</strong> in questions and explanations with live preview.</li>
      <li><strong>Advanced membership system:</strong> different roles (admin / doctor) with configurable expiry and auto-renewal.</li>
      <li><strong>Integrated verification system:</strong> question review with detailed statistics and a trust score per user.</li>
      <li><strong>Tag and category management:</strong> organise questions by topic and difficulty.</li>
      <li><strong>Backup and import/export:</strong> protect your data in multiple formats (Excel, CSV, JSON).</li>
      <li><strong>Fully localised interface:</strong> RTL support with four visual themes.</li>
      <li><strong>Offline mode:</strong> smart notifications when the internet drops.</li>
      <li><strong>Accessibility:</strong> screen-reader support, keyboard shortcuts, and adequate colour contrast.</li>
    </ul>
    <h4>Target audience</h4>
    <ul>
      <li>Practising psychiatrists</li>
      <li>Psychiatry residents</li>
      <li>Medical students interested in mental health</li>
      <li>Researchers in the field of psychiatry</li>
    </ul>
    <h4>Requirements</h4>
    <table class="table-shared">
      <thead>
        <tr><th>Requirement</th><th>Details</th></tr>
      </thead>
      <tbody>
        <tr><td>Browser</td><td>Any modern browser (Chrome, Firefox, Edge, Safari)</td></tr>
        <tr><td>Account</td><td>Created by the system administrator</td></tr>
        <tr><td>Connection</td><td>Required for core operations; some pages work offline</td></tr>
      </tbody>
    </table>`
    },

    {
      id: 'getting-started',
      num: 2,
      icon: 'bi bi-rocket-takeoff',
      title: 'Getting started',
      content: `<h4>Step 1: Sign in</h4>
    <ol>
      <li>Open your browser and go to the app's URL.</li>
      <li>The sign-in screen appears with the system logo.</li>
      <li>Enter your <strong>username</strong> and <strong>password</strong> (provided by the administrator).</li>
      <li>Click the <strong>"Sign in"</strong> button.</li>
      <li>If this is your first time, you may be asked to change your password.</li>
    </ol>
    <blockquote>
      <p><strong>💡 Tip:</strong> if you forget your password, contact the system administrator to reset it. You cannot recover it yourself.</p>
    </blockquote>
    <h4>Step 2: Tour the interface</h4>
    <p>After signing in you will land on the <strong>Dashboard</strong>. The interface consists of:</p>
    <ul>
      <li><strong>Top navigation bar:</strong> links to Content, Tests, and (for admins) Administration.</li>
      <li><strong>User menu:</strong> in the corner — Profile, Change Password, History, Settings, and Sign out.</li>
      <li><strong>Theme switcher:</strong> to change the visual appearance.</li>
      <li><strong>Notification bell:</strong> shows the count of pending reports (admins only).</li>
    </ul>
    <h4>Step 3: Your first steps</h4>
    <ul>
      <li>Browse questions from <strong>"Questions"</strong> in the navigation bar.</li>
      <li>Add a new question from the <strong>"Add Question"</strong> button.</li>
      <li>Start a learning session from <strong>"Self-study"</strong> with custom filters.</li>
      <li>Try <strong>"Exam"</strong> to test yourself seriously under time pressure.</li>
      <li>If you are an admin, explore the <strong>"Admin"</strong> menu.</li>
    </ul>
    <h4>Step 4: Customise your experience</h4>
    <ol>
      <li>From the user menu, open <strong>"Settings"</strong>.</li>
      <li>Set the default number of questions per page.</li>
      <li>Choose your preferred difficulty filter.</li>
      <li>Turn auto-advance and sound effects on or off.</li>
    </ol>`
    },

    {
      id: 'dashboard',
      num: 3,
      icon: 'bi bi-speedometer2',
      title: 'The Dashboard',
      content: `<p>The Dashboard is the <strong>command centre of the app</strong>. It gives you an overview of your activity and helps you decide what to do next.</p>
    <h4>Dashboard elements</h4>
    <table class="table-shared">
      <thead>
        <tr><th>Element</th><th>Purpose</th></tr>
      </thead>
      <tbody>
        <tr><td>Welcome message</td><td>Shows your name and a moving welcome line</td></tr>
        <tr><td>"Continue where you left off" card</td><td>Appears if you have a paused test session, with a progress bar and a Resume button</td></tr>
        <tr><td>Test cards</td><td>Two cards: Exam and Self-study — each with its own colour</td></tr>
        <tr><td>Quick stats</td><td>Total questions, verified, unverified, and bookmarks</td></tr>
        <tr><td>"Did you know?"</td><td>A random psychiatric fact that rotates every 10 minutes</td></tr>
        <tr><td>Action buttons</td><td>Add question, view questions, review, bookmarks</td></tr>
        <tr><td>Recent questions</td><td>The last five questions with quick interactions</td></tr>
      </tbody>
    </table>
    <h4>The "Continue where you left off" card</h4>
    <p>If you pause an exam or self-study session, this card appears automatically. It shows:</p>
    <ul>
      <li>The session name (tag)</li>
      <li>A circular progress bar showing the percentage</li>
      <li>The number of the question you stopped at</li>
      <li>A <strong>"Resume"</strong> button to jump straight back in</li>
    </ul>
    <blockquote>
      <p><strong>💡 Tip:</strong> dashboard stats update automatically when you add or remove questions. There is no need to reload the page manually.</p>
    </blockquote>`
    },

    {
      id: 'questions',
      num: 4,
      icon: 'bi bi-question-circle',
      title: 'Managing questions',
      content: `<h4>Browsing the list</h4>
    <p>From the navigation bar, open <strong>Questions</strong>. The page shows:</p>
    <ul>
      <li>An advanced filter bar at the top</li>
      <li>Chips for the active filters (each removable individually)</li>
      <li>Pagination info (total count, current page)</li>
      <li>Question cards with full details</li>
      <li>Pagination controls at the bottom</li>
    </ul>
    <h4>Adding a question</h4>
    <p>From the navigation bar → Questions → <strong>Add Question</strong>. Fill in the following fields:</p>
    <table class="table-shared">
      <thead>
        <tr><th>Field</th><th>Description</th><th>Required</th></tr>
      </thead>
      <tbody>
        <tr><td>Question</td><td>Question text (supports Markdown, max 3000 characters)</td><td>✅</td></tr>
        <tr><td>Choices</td><td>Minimum 2, maximum 8. Each up to 300 characters</td><td>✅</td></tr>
        <tr><td>Correct answer</td><td>Pick the correct choice by clicking its "correct" radio</td><td>✅</td></tr>
        <tr><td>Explanation</td><td>Explanation of the answer (Markdown, shown after the test)</td><td>Optional</td></tr>
        <tr><td>Category</td><td>Pick a category from the list</td><td>Optional</td></tr>
        <tr><td>Difficulty</td><td>Easy / medium / hard</td><td>✅</td></tr>
        <tr><td>Tags</td><td>Comma-separated keywords</td><td>Optional</td></tr>
        <tr><td>Source</td><td>Reference for the question (book, article…)</td><td>Optional</td></tr>
        <tr><td>Verified</td><td>Check the box if you are confident in the question's accuracy</td><td>Optional</td></tr>
        <tr><td>Verification notes</td><td>Shown only when the question is verified</td><td>Optional</td></tr>
      </tbody>
    </table>
    <h4>Editing a question</h4>
    <ol>
      <li>In the questions list, click the ✏️ <strong>Edit</strong> icon next to a question.</li>
      <li>The edit page opens with the existing data pre-filled.</li>
      <li>Make your changes and click <strong>"Update question"</strong>.</li>
    </ol>
    <blockquote>
      <p><strong>⚠️ Note:</strong> only an admin or the question's author can edit it. Doctors cannot edit other users' questions.</p>
    </blockquote>
    <h4>Deleting a question</h4>
    <ol>
      <li>Click the 🗑️ <strong>Delete</strong> icon.</li>
      <li>A confirmation dialog appears.</li>
      <li>Click <strong>"Yes"</strong> to confirm.</li>
    </ol>
    <h4>Duplicating a question</h4>
    <p>Click the 📄 <strong>Duplicate</strong> icon to create a copy with a new date and author. Useful for building variants of the same question.</p>
    <h4>Exporting a single question</h4>
    <p>Click the ⬇️ <strong>Export</strong> icon to download the question as a JSON file. The file contains all question data, including choices, correct answer, and explanation.</p>
    <h4>Search and filter</h4>
    <p>Use the filter bar to search by:</p>
    <ul>
      <li><strong>Free text:</strong> searches the question text, explanation, and tags</li>
      <li><strong>Category:</strong> a specific category or "All categories"</li>
      <li><strong>Difficulty:</strong> easy / medium / hard</li>
      <li><strong>Verification:</strong> verified only</li>
      <li><strong>Tag:</strong> a specific tag</li>
    </ul>
    <h4>Bulk actions</h4>
    <p>Select multiple questions with the checkboxes, then:</p>
    <ul>
      <li><strong>Verify selected:</strong> verify all selected questions at once</li>
      <li><strong>Unverify:</strong> unverify the selected questions</li>
      <li><strong>Edit tags:</strong> add or remove tags across several questions</li>
    </ul>`
    },

    {
      id: 'question-form',
      num: 5,
      icon: 'bi bi-pencil-square',
      title: 'Inside the question form',
      content: `<h4>Markdown editor</h4>
    <p>The question and explanation fields use an advanced <strong>Markdown editor</strong> that offers:</p>
    <ul>
      <li><strong>Toolbar:</strong> buttons for formatting (bold, italic, underline, code, link, image, table, lists)</li>
      <li><strong>Character counter:</strong> shows characters used versus the maximum</li>
      <li><strong>Word count:</strong> shows the number of words</li>
      <li><strong>Preview toggle:</strong> renders the final view of the text before saving</li>
      <li><strong>Help link:</strong> takes you to the Markdown section of this manual</li>
    </ul>
    <h4>Choice editor</h4>
    <p>Lets you:</p>
    <ul>
      <li>Add up to 8 choices</li>
      <li>Delete choices (minimum 2 remains)</li>
      <li>Mark the correct choice by selecting its "correct" radio</li>
      <li>Number the choices automatically</li>
    </ul>
    <h4>Tag input</h4>
    <p>The tag field offers:</p>
    <ul>
      <li><strong>Smart suggestions:</strong> as you type, existing tags appear</li>
      <li><strong>Recent tags:</strong> tags you used recently appear above the field</li>
      <li><strong>Auto-split:</strong> enter tags separated by commas</li>
    </ul>
    <h4>Choosing a category</h4>
    <p>The dropdown shows:</p>
    <ul>
      <li>Recently used categories at the top (labelled "recent")</li>
      <li>The rest in alphabetical order</li>
      <li>A "No category" option</li>
    </ul>
    <h4>Difficulty selector</h4>
    <p>Three coloured buttons:</p>
    <ul>
      <li>🟢 <strong>Easy</strong> (green)</li>
      <li>🟡 <strong>Medium</strong> (yellow)</li>
      <li>🔴 <strong>Hard</strong> (red)</li>
    </ul>
    <h4>Validation</h4>
    <p>Before saving, the system checks:</p>
    <ul>
      <li>That the question text is not empty</li>
      <li>That at least two choices are filled</li>
      <li>That the correct-answer index points at a filled choice</li>
      <li>That no field exceeds its character limit</li>
    </ul>`
    },

    {
      id: 'tags',
      num: 6,
      icon: 'bi bi-tags',
      title: 'Managing tags',
      content: `<p>Tags help organise questions and make them easier to find. Admins can open <strong>"Manage tags"</strong> from the Admin menu.</p>
    <h4>Viewing tags</h4>
    <p>The table shows, per tag:</p>
    <ul>
      <li><strong>Tag name</strong></li>
      <li><strong>Question count:</strong> how many questions carry the tag</li>
      <li><strong>Verified count:</strong> how many of those are verified</li>
      <li><strong>Actions:</strong> rename and delete</li>
    </ul>
    <h4>Renaming a tag</h4>
    <ol>
      <li>Click the ✏️ icon next to the tag.</li>
      <li>A dialog appears with the current name (disabled) and a new-name field.</li>
      <li>Enter the new name and click <strong>"Update"</strong>.</li>
      <li>All questions carrying the old tag are updated.</li>
    </ol>
    <h4>Deleting a tag</h4>
    <ol>
      <li>Click the 🗑️ icon next to the tag.</li>
      <li>A confirmation dialog appears.</li>
      <li>The tag is removed from every question and then deleted.</li>
    </ol>
    <blockquote>
      <p><strong>⚠️ Warning:</strong> deleting a tag does not delete the questions carrying it — it only removes the tag.</p>
    </blockquote>
    <h4>Merging tags</h4>
    <p>If you have similar tags (such as "depression" and "severe depression"):</p>
    <ol>
      <li>Select the tags to merge with the checkboxes.</li>
      <li>Click <strong>"Merge tags"</strong> at the top.</li>
      <li>Enter the target tag name.</li>
      <li>Click <strong>"Merge"</strong>.</li>
      <li>All questions are moved to the target tag and the source tags are removed.</li>
    </ol>
    <blockquote>
      <p><strong>💡 Tip:</strong> use specific, clear tags. For example: "depression, CBT, SSRIs" rather than overly generic ones.</p>
    </blockquote>`
    },

    {
      id: 'categories',
      num: 7,
      icon: 'bi bi-folder2-open',
      title: 'Categories',
      content: `<p>Categories are <strong>top-level groups</strong> of questions (such as Mood Disorders, Anxiety, Addiction). Each question can belong to one category or to none.</p>
    <h4>Categories shipped with the system</h4>
    <table class="table-shared">
      <thead>
        <tr><th>Category</th><th>Description</th></tr>
      </thead>
      <tbody>
        <tr><td>Assessment and diagnosis</td><td>Interviewing and psychiatric assessment</td></tr>
        <tr><td>Psychotic disorders</td><td>Schizophrenia, brief psychosis, delusional disorder</td></tr>
        <tr><td>Mood disorders</td><td>Depression, bipolar, cyclothymia</td></tr>
        <tr><td>Anxiety disorders</td><td>Generalised anxiety, panic, phobias, OCD</td></tr>
        <tr><td>Personality disorders</td><td>Clusters A, B, C</td></tr>
        <tr><td>Addiction</td><td>Alcohol, drugs, gambling</td></tr>
        <tr><td>Neurocognitive disorders</td><td>Dementia, Alzheimer's, delirium</td></tr>
        <tr><td>Geriatric psychiatry</td><td>Elderly, grief, dementia</td></tr>
        <tr><td>Child and adolescent disorders</td><td>Autism, ADHD, developmental delay</td></tr>
        <tr><td>Dissociative disorders</td><td>Amnesia, depersonalisation</td></tr>
        <tr><td>Somatic and factitious</td><td>Somatic symptoms, conversion, factitious</td></tr>
        <tr><td>Impulse-control disorders</td><td>Intermittent explosive, kleptomania</td></tr>
        <tr><td>Eating disorders</td><td>Anorexia, bulimia, binge eating</td></tr>
        <tr><td>Sleep disorders</td><td>Insomnia, narcolepsy, apnoea</td></tr>
        <tr><td>Psychotherapies</td><td>CBT, analytic, family, group</td></tr>
        <tr><td>Psychopharmacology</td><td>Antipsychotics, antidepressants</td></tr>
        <tr><td>Forensic psychiatry</td><td>Competency, insanity defence</td></tr>
        <tr><td>Psychiatric emergencies</td><td>Agitation, suicidality, aggression</td></tr>
      </tbody>
    </table>
    <h4>Managing categories (admins only)</h4>
    <p>For admins:</p>
    <ul>
      <li><strong>Add category:</strong> name, description, colour (from a palette or custom), icon</li>
      <li><strong>Edit category:</strong> change any attribute</li>
      <li><strong>Delete category:</strong> questions are kept; they simply become uncategorised</li>
    </ul>`
    },

    {
      id: 'tests',
      num: 8,
      icon: 'bi bi-pencil-square',
      title: 'Test modes — overview',
      content: `<p>The system offers two test modes, each designed for a different purpose:</p>
    <table class="table-shared">
      <thead>
        <tr><th>Feature</th><th>Exam</th><th>Self-study</th></tr>
      </thead>
      <tbody>
        <tr><td>Purpose</td><td>Simulate a real exam</td><td>Deep learning with explanations</td></tr>
        <tr><td>Timer</td><td>✅ Yes (countdown, auto-finish)</td><td>✅ Yes (countdown, then stopwatch overtime)</td></tr>
        <tr><td>Source</td><td>Tag, bookmarks, or blueprint</td><td>Multiple filters (category, difficulty, tags)</td></tr>
        <tr><td>Explanations</td><td>❌ No</td><td>✅ Yes (after each answer)</td></tr>
        <tr><td>Pause / resume</td><td>✅ Yes</td><td>✅ Yes</td></tr>
        <tr><td>Share results</td><td>❌ No</td><td>❌ No</td></tr>
        <tr><td>Accent colour</td><td>Red</td><td>Green</td></tr>
      </tbody>
    </table>
    <h4>Which mode should you pick?</h4>
    <ul>
      <li><strong>Exam:</strong> when you want to test yourself seriously under time pressure.</li>
      <li><strong>Self-study:</strong> when you want to learn, understand every question, and filter by category and difficulty.</li>
    </ul>`
    },

    {
      id: 'exam-mode',
      num: 9,
      icon: 'bi bi-journal-check',
      title: 'Exam mode in detail',
      content: `<h4>Starting the exam</h4>
    <ol>
      <li>From the navigation bar → <strong>Tests</strong> → <strong>Exam</strong>.</li>
      <li>Choose the source:
        <ul>
          <li><strong>Tag:</strong> pick a tag from the list (shows the number of available questions)</li>
          <li><strong>Bookmarks:</strong> test from your bookmarked questions only</li>
          <li><strong>Exam blueprint:</strong> (admins) pick a blueprint that distributes questions by weight</li>
        </ul>
      </li>
      <li>Click <strong>"Start exam"</strong>.</li>
    </ol>
    <h4>During the exam</h4>
    <ul>
      <li><strong>Timer:</strong> shown at the top of the page, counting down the remaining time. Its colour changes as time runs low.</li>
      <li><strong>Progress bar:</strong> shows the answered percentage with markers at 25%, 50%, 75%, and 100%.</li>
      <li><strong>Navigation:</strong> Previous / Next buttons plus quick-nav dots.</li>
      <li><strong>Keyboard shortcuts:</strong>
        <ul>
          <li><code>1</code>-<code>8</code>: pick an answer</li>
          <li><code>→</code>: next question</li>
          <li><code>←</code>: previous question</li>
          <li><code>Esc</code>: finish the exam</li>
        </ul>
      </li>
    </ul>
    <h4>Pausing and resuming</h4>
    <p>You can pause the exam and come back later:</p>
    <ol>
      <li>Click <strong>"Pause"</strong>.</li>
      <li>Your progress is saved automatically.</li>
      <li>On return, the "Continue where you left off" card appears on the Dashboard.</li>
      <li>Click <strong>"Resume"</strong> to pick up where you stopped.</li>
    </ol>
    <h4>Finishing the exam</h4>
    <ul>
      <li>If there are unanswered questions, a confirmation appears.</li>
      <li>After finishing, the results page opens with a detailed review.</li>
      <li>You can retry from the <strong>"Retry"</strong> button.</li>
    </ul>
    <blockquote>
      <p><strong>⚠️ Warning:</strong> if the timer runs out before you finish, the exam ends automatically and only the answers you submitted are counted.</p>
    </blockquote>`
    },

    {
      id: 'study-mode',
      num: 10,
      icon: 'bi bi-book-half',
      title: 'Self-study mode in detail',
      content: `<h4>What makes self-study different?</h4>
    <ul>
      <li><strong>Explanation after each answer:</strong> the question's explanation appears immediately after you answer.</li>
      <li><strong>Flexible timer:</strong> a countdown; when it hits zero it becomes a stopwatch rather than ending the session.</li>
      <li><strong>Multiple filters:</strong> filter by category, difficulty, tags, and verified-only.</li>
      <li><strong>Multiple sources:</strong> a tag, bookmarks, or (admins) a blueprint.</li>
      <li><strong>Pause and resume:</strong> stop and come back later.</li>
      <li><strong>Smart review:</strong> a "Smart review" button to start a session of questions that are due for spaced-repetition review.</li>
      <li><strong>Drill from mistakes:</strong> start a session with specific questions from the mistakes notebook or the fragile-knowledge list.</li>
    </ul>
    <h4>Setting up self-study</h4>
    <ol>
      <li>From the navigation bar → Tests → <strong>Self-study</strong>.</li>
      <li>Choose your criteria:
        <table class="table-shared">
          <thead>
            <tr><th>Criterion</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td>Number of questions</td><td>From 1 up to the maximum available</td></tr>
            <tr><td>Category</td><td>A specific category, or empty for all</td></tr>
            <tr><td>Difficulty</td><td>Easy / medium / hard, or all</td></tr>
            <tr><td>Tags</td><td>Comma-separated tags</td></tr>
            <tr><td>Verified only</td><td>Only verified questions</td></tr>
            <tr><td>Bookmarks only</td><td>Use your bookmarked questions</td></tr>
            <tr><td>Exam blueprint</td><td>(Admins) distribute by blueprint weights</td></tr>
          </tbody>
        </table>
      </li>
      <li>The available question count updates automatically with the filters.</li>
      <li>Click <strong>"Start self-study"</strong>.</li>
    </ol>
    <h4>During self-study</h4>
    <ul>
      <li>Answer the question.</li>
      <li>The <strong>explanation</strong> appears immediately.</li>
      <li>Read it carefully before moving on.</li>
      <li>Use the <strong>"Next"</strong> button to continue.</li>
    </ul>
    <h4>Smart review</h4>
    <p>If you have questions due for review (per the spaced-repetition algorithm), a card appears on the setup page with a "Smart review" button. Click it to start a session of the most important questions to revisit.</p>
    <h4>Drilling your mistakes</h4>
    <p>From the "Mistakes notebook" or "Fragile knowledge" pages, click "Quiz me on my mistakes" or "Review these questions" to start a self-study session with those specific questions.</p>`
    },

    {
      id: 'bookmarks',
      num: 11,
      icon: 'bi bi-bookmark-heart',
      title: 'Bookmarks',
      content: `<p>The bookmarks system helps you keep important questions for later or use them in custom tests.</p>
    <h4>Adding a question to bookmarks</h4>
    <ol>
      <li>On any question card, click the 🔖 icon.</li>
      <li>The icon fills in with an animation.</li>
      <li>The bookmark count on the Dashboard updates.</li>
    </ol>
    <h4>Removing a bookmark</h4>
    <p>Click the same icon again. A confirmation appears.</p>
    <h4>The bookmarks page</h4>
    <p>From the navigation bar → <strong>Bookmarks</strong>. It shows:</p>
    <ul>
      <li>All your saved questions</li>
      <li>Buttons to start an exam or self-study from bookmarks only</li>
      <li>The ability to remove any question from bookmarks</li>
    </ul>
    <h4>Using bookmarks in tests</h4>
    <ul>
      <li><strong>Exam / self-study:</strong> choose "Bookmarks" as the source instead of a tag</li>
    </ul>
    <blockquote>
      <p><strong>💡 Tip:</strong> use bookmarks to save questions you find difficult. Then run repeated tests on them until you have them down.</p>
    </blockquote>`
    },

    {
      id: 'review',
      num: 12,
      icon: 'bi bi-check2-all',
      title: 'Verification and review',
      content: `<p>Verification is the process of <strong>reviewing a question for accuracy</strong>. It is a core part of keeping the medical content trustworthy.</p>
    <h4>Who can verify?</h4>
    <table class="table-shared">
      <thead>
        <tr><th>Role</th><th>Permissions</th></tr>
      </thead>
      <tbody>
        <tr><td>Doctor</td><td>Can verify any question, including their own</td></tr>
        <tr><td>Admin</td><td>Can verify any question</td></tr>
      </tbody>
    </table>
    <h4>Verifying a single question</h4>
    <ol>
      <li>On the question card, click the ✅ icon.</li>
      <li>If the question was unverified: it is verified, and your name and the date are recorded.</li>
      <li>If the question was verified: verification is removed.</li>
    </ol>
    <h4>The review queue</h4>
    <p>From the navigation bar → Questions → <strong>Review</strong>. It shows:</p>
    <ul>
      <li>All unverified questions</li>
      <li>Single-question or bulk verification</li>
      <li>A counter of remaining questions</li>
    </ul>
    <h4>Bulk verification</h4>
    <ol>
      <li>Select the questions you want to verify.</li>
      <li>Click <strong>"Verify selected"</strong>.</li>
      <li>You may add verification notes (optional).</li>
      <li>All selected questions are verified.</li>
    </ol>
    <h4>Trust score</h4>
    <p>Each user has a <strong>trust score</strong> computed from their verified-question ratio:</p>
    <ul>
      <li>0% = no verified questions</li>
      <li>100% = all questions verified</li>
      <li>Shown on the profile</li>
    </ul>
    <h4>Verification statistics (admins only)</h4>
    <p>From Admin → <strong>Verification statistics</strong>:</p>
    <ul>
      <li>Verified and unverified question counts</li>
      <li>Overall verification rate</li>
      <li>Top verifiers</li>
      <li>Verification by category</li>
      <li>A monthly chart</li>
    </ul>`
    },

    {
      id: 'admin-users',
      num: 13,
      icon: 'bi bi-people-fill',
      title: 'User management (admins)',
      content: `<p>From Admin → <strong>Users</strong>. Admins can manage all user accounts.</p>
    <h4>Browsing users</h4>
    <p>The page shows cards for each user, containing:</p>
    <ul>
      <li>An avatar (first letter of the name)</li>
      <li>Full name and username</li>
      <li>Role (admin / doctor) and status (active / inactive)</li>
      <li>Number of published questions</li>
      <li>Latest exam accuracy</li>
      <li>Last sign-in</li>
      <li>Remaining validity</li>
    </ul>
    <h4>Adding a new user</h4>
    <ol>
      <li>Click <strong>"Add user"</strong>.</li>
      <li>Fill in the fields:
        <table class="table-shared">
          <thead>
            <tr><th>Field</th><th>Description</th><th>Required</th></tr>
          </thead>
          <tbody>
            <tr><td>Username</td><td>At least 3 characters, letters and digits</td><td>✅</td></tr>
            <tr><td>Full name</td><td>Displayed name</td><td>Optional</td></tr>
            <tr><td>Password</td><td>At least 8 characters</td><td>✅</td></tr>
            <tr><td>Role</td><td>Admin or doctor</td><td>✅</td></tr>
            <tr><td>Expiry period</td><td>In days (0 = never expires)</td><td>✅</td></tr>
            <tr><td>Auto-renew</td><td>Automatic extension on expiry</td><td>Optional</td></tr>
            <tr><td>Active account</td><td>Activate the account immediately</td><td>✅</td></tr>
          </tbody>
        </table>
      </li>
      <li>Click <strong>"Add"</strong>.</li>
    </ol>
    <h4>Editing a user</h4>
    <p>Click the ✏️ icon next to a user. You can change any field except the username.</p>
    <h4>Resetting a password</h4>
    <ol>
      <li>Click the 🔑 icon.</li>
      <li>Enter the <strong>current admin password</strong> (to re-authenticate).</li>
      <li>Enter a new password, or leave the field empty to generate a random one.</li>
      <li>Click <strong>"Set"</strong>.</li>
    </ol>
    <h4>Activating / deactivating a user</h4>
    <p>Click the toggle icon. A deactivated user cannot sign in.</p>
    <h4>Deleting a user</h4>
    <blockquote>
      <p><strong>⚠️ Warning:</strong> deleting a user is permanent and cannot be undone. All their data is removed. You cannot delete yourself.</p>
    </blockquote>
    <h4>Bulk actions</h4>
    <p>Select several users, then:</p>
    <ul>
      <li><strong>Activate:</strong> activate all selected</li>
      <li><strong>Deactivate:</strong> deactivate all selected</li>
    </ul>`
    },

    {
      id: 'admin-settings',
      num: 14,
      icon: 'bi bi-gear',
      title: 'System settings (admins)',
      content: `<p>From Admin → <strong>System settings</strong>. Controls the system's default behaviour.</p>
    <h4>Available settings</h4>
    <table class="table-shared">
      <thead>
        <tr><th>Setting</th><th>Description</th><th>Default</th></tr>
      </thead>
      <tbody>
        <tr><td>Default account expiry period</td><td>Applied when creating a new user (0 = never expires)</td><td>60 days</td></tr>
        <tr><td>Default auto-renewal days</td><td>Automatic extension on expiry (0 = no renewal)</td><td>30 days</td></tr>
        <tr><td>Default exam duration</td><td>In minutes, used by the exam timer</td><td>60 minutes</td></tr>
      </tbody>
    </table>
    <h4>Session lifetime</h4>
    <p>The current sign-in session lifetime is <strong>15 days</strong>. It can be changed from the server settings (<code>SESSION_COOKIE_AGE</code>).</p>
    <h4>Saving settings</h4>
    <ol>
      <li>Change the values you want.</li>
      <li>Click <strong>"Save settings"</strong>.</li>
      <li>A success message appears.</li>
    </ol>
    <blockquote>
      <p><strong>💡 Tip:</strong> changing the exam duration only affects new exams. In-flight exams keep the duration they started with.</p>
    </blockquote>`
    },

    {
      id: 'admin-flags',
      num: 15,
      icon: 'bi bi-flag',
      title: 'Reports',
      content: `<p>Any user can <strong>report a question</strong> they believe is wrong or contains an error. Reports appear on the "Reports" page for admins.</p>
    <h4>Reporting a question (any user)</h4>
    <ol>
      <li>On the question card, click the 🚩 icon.</li>
      <li>You may add a reason (optional).</li>
      <li>Click <strong>"OK"</strong>.</li>
      <li>The report is sent for review.</li>
    </ol>
    <h4>Managing reports (admins)</h4>
    <p>From Admin → <strong>Reports</strong>:</p>
    <ul>
      <li>View all pending reports</li>
      <li>Per report: the question, the reporter, the author, the reason, and the date</li>
      <li>A <strong>"View question"</strong> button that jumps straight to the question</li>
      <li>A <strong>"Resolve"</strong> button that closes the report</li>
    </ul>
    <h4>Bulk-resolving reports</h4>
    <ol>
      <li>Select the reports to resolve.</li>
      <li>Click <strong>"Resolve"</strong>.</li>
      <li>All selected reports are closed.</li>
    </ol>
    <h4>Recommended workflow</h4>
    <ol>
      <li>Read the report and its reason.</li>
      <li>Click "View question" to verify.</li>
      <li>If there is an error: fix the question, then resolve the report.</li>
      <li>If the question is correct: resolve the report with a note explaining why.</li>
    </ol>`
    },

    {
      id: 'admin-active',
      num: 16,
      icon: 'bi bi-people',
      title: 'Active users',
      content: `<p>This page shows <strong>users currently connected to the system</strong>.</p>
    <h4>What is shown</h4>
    <ul>
      <li><strong>Name:</strong> the user's full name</li>
      <li><strong>Role:</strong> admin or doctor</li>
      <li><strong>IP address:</strong> the network address</li>
      <li><strong>Last activity:</strong> relative time (for example, "5 minutes ago")</li>
    </ul>
    <h4>Auto-refresh</h4>
    <ul>
      <li>The list refreshes every <strong>30 seconds</strong>.</li>
      <li>A <strong>🔴 Live</strong> indicator shows that refreshing is on.</li>
      <li>You can click <strong>"Refresh"</strong> for an immediate update.</li>
    </ul>
    <h4>What "active" means</h4>
    <ul>
      <li>A user counts as active if they had activity within the last <strong>5 minutes</strong>.</li>
      <li>Stale sessions are cleaned up automatically every hour.</li>
    </ul>`
    },

    {
      id: 'database',
      num: 17,
      icon: 'bi bi-database',
      title: 'Database and backups',
      content: `<p>From Admin → <strong>Database</strong>. This page is the system's data-control centre.</p>
    <h4>Database information</h4>
    <table class="table-shared">
      <thead>
        <tr><th>Info</th><th>Description</th></tr>
      </thead>
      <tbody>
        <tr><td>File size</td><td>Size of the database file</td></tr>
        <tr><td>Last modified</td><td>Date of the last modification to the file</td></tr>
        <tr><td>Total questions</td><td>Count of all questions</td></tr>
        <tr><td>Verified questions</td><td>Count of verified questions</td></tr>
        <tr><td>Total users</td><td>Count of accounts</td></tr>
        <tr><td>Categories</td><td>Count of categories</td></tr>
        <tr><td>Self-study sessions</td><td>Count of saved sessions</td></tr>
      </tbody>
    </table>
    <h4>Creating a backup</h4>
    <ol>
      <li>Click <strong>"Create backup"</strong>.</li>
      <li>The database file is copied to the backup folder.</li>
      <li>A success message appears.</li>
    </ol>
    <h4>Viewing and restoring backups</h4>
    <ol>
      <li>Click <strong>"Show backups"</strong>.</li>
      <li>A list of all backups appears with their size and date.</li>
      <li>To restore one, click <strong>"Restore"</strong> next to it.</li>
      <li>A safety backup is created automatically before the restore.</li>
    </ol>
    <h4>Clearing the database</h4>
    <blockquote>
      <p><strong>⚠️ Severe warning:</strong> clearing the database deletes all questions and sessions. A backup is created automatically before the clear. This operation requires typing "DELETE" to confirm.</p>
    </blockquote>
    <h4>Downloading backups</h4>
    <blockquote>
      <p><strong>💡 Important tip:</strong> backups are stored on the same server. To protect your data against server failure, download backups regularly and keep them somewhere external and safe.</p>
    </blockquote>`
    },

    {
      id: 'import-export',
      num: 18,
      icon: 'bi bi-upload',
      title: 'Import and export',
      content: `<h4>Importing questions</h4>
    <p>From Admin → <strong>Import</strong>. The system supports several sources:</p>
    <h4>1. From a file</h4>
    <p>Supported file types:</p>
    <ul>
      <li><strong>Excel</strong> (.xlsx, .xls)</li>
      <li><strong>CSV</strong> (.csv)</li>
      <li><strong>JSON</strong> (.json)</li>
    </ul>
    <h4>Required columns</h4>
    <table class="table-shared">
      <thead>
        <tr><th>Column</th><th>Description</th><th>Required</th></tr>
      </thead>
      <tbody>
        <tr><td>question</td><td>Question text</td><td>✅</td></tr>
        <tr><td>choice_1</td><td>First choice</td><td>✅</td></tr>
        <tr><td>choice_2</td><td>Second choice</td><td>✅</td></tr>
        <tr><td>choice_3 to choice_8</td><td>Additional choices</td><td>Optional</td></tr>
        <tr><td>correct_answer</td><td>Correct-answer index (1-8)</td><td>✅</td></tr>
        <tr><td>explanation</td><td>Answer explanation</td><td>Optional</td></tr>
        <tr><td>tags</td><td>Comma-separated tags</td><td>Optional</td></tr>
        <tr><td>difficulty</td><td>easy / medium / hard</td><td>Optional</td></tr>
        <tr><td>category</td><td>Category name</td><td>Optional</td></tr>
      </tbody>
    </table>
    <h4>2. From Telegram</h4>
    <p>Accepts a <code>result.json</code> exported from Telegram:</p>
    <ul>
      <li>Reads polls from chats</li>
      <li>Converts them into multiple-choice questions</li>
      <li>Determines the correct answer automatically from the vote results</li>
      <li>Adds a note when the answer was guessed</li>
    </ul>
    <h4>Exporting questions</h4>
    <p>From Admin → Database → <strong>Export</strong>:</p>
    <ul>
      <li><strong>Excel (.xlsx):</strong> formatted sheet</li>
      <li><strong>CSV (.csv):</strong> plain comma-separated text</li>
      <li><strong>JSON (.json):</strong> structured data for developers</li>
    </ul>
    <h4>Exporting verified questions only</h4>
    <p>You can export only the verified questions from the <strong>"Export verified"</strong> button on the verification-statistics page.</p>`
    },

    {
      id: 'markdown',
      num: 19,
      icon: 'bi bi-markdown',
      title: 'Markdown guide',
      content: `<p>Markdown is a lightweight formatting language used to write questions and explanations. The system supports a wide range of formats.</p>
    <h4>Basic formatting</h4>
    <table class="table-shared">
      <thead>
        <tr><th>Style</th><th>Syntax</th><th>Result</th></tr>
      </thead>
      <tbody>
        <tr><td>Bold</td><td><code>**text**</code></td><td><strong>text</strong></td></tr>
        <tr><td>Italic</td><td><code>*text*</code></td><td><em>text</em></td></tr>
        <tr><td>Underline</td><td><code>&lt;u&gt;text&lt;/u&gt;</code></td><td><u>text</u></td></tr>
        <tr><td>Strikethrough</td><td><code>~~text~~</code></td><td><s>text</s></td></tr>
        <tr><td>Code</td><td><code>\`code\`</code></td><td><code>code</code></td></tr>
        <tr><td>Superscript</td><td><code>^(text)^</code></td><td>text²</td></tr>
        <tr><td>Subscript</td><td><code>~(text)~</code></td><td>text₂</td></tr>
        <tr><td>Highlight</td><td><code>==text==</code></td><td><mark>text</mark></td></tr>
      </tbody>
    </table>
    <h4>Links and images</h4>
    <table class="table-shared">
      <thead>
        <tr><th>Type</th><th>Syntax</th></tr>
      </thead>
      <tbody>
        <tr><td>Link</td><td><code>[link text](https://example.com)</code></td></tr>
        <tr><td>Image</td><td><code>![image alt](https://example.com/image.png)</code></td></tr>
      </tbody>
    </table>
    <h4>Lists</h4>
    <table class="table-shared">
      <thead>
        <tr><th>Type</th><th>Syntax</th></tr>
      </thead>
      <tbody>
        <tr><td>Unordered list</td><td><code>- item</code>, then a new line <code>- another item</code></td></tr>
        <tr><td>Ordered list</td><td><code>1. first item</code>, then a new line <code>2. second item</code></td></tr>
      </tbody>
    </table>
    <h4>Tables</h4>
    <pre><code>| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| text     | text     | text     |
| text     | text     | text     |</code></pre>
    <h4>Quotes</h4>
    <pre><code>> this is a quoted line
> it can span multiple lines</code></pre>
    <h4>Headings</h4>
    <pre><code># Heading 1
## Heading 2
### Heading 3
#### Heading 4</code></pre>
    <h4>Horizontal rule</h4>
    <pre><code>---</code></pre>
    <h4>Practical example for a medical question</h4>
    <pre><code>What is the initial dose of **fluoxetine** for depression?
- 10 mg
- 20 mg ← the correct answer
- 40 mg
- 60 mg
Explanation: the recommended initial dose is **20 mg** daily,
which can be titrated based on response.
Source: Kaplan & Sadock's, 12th edition</code></pre>
    <blockquote>
      <p><strong>💡 Tip:</strong> use the "Preview" button in the Markdown editor to see the final rendering before saving.</p>
    </blockquote>`
    },

    {
      id: 'shortcuts',
      num: 20,
      icon: 'bi bi-keyboard',
      title: 'Keyboard shortcuts',
      content: `<p>The system supports keyboard shortcuts to speed up navigation during tests.</p>
    <table class="table-shared">
      <thead>
        <tr><th>Key</th><th>Action</th><th>Where</th></tr>
      </thead>
      <tbody>
        <tr><td><code>1</code> - <code>8</code></td><td>Pick answer 1 to 8</td><td>Test questions</td></tr>
        <tr><td><code>→</code> (right arrow)</td><td>Next question</td><td>Test questions</td></tr>
        <tr><td><code>←</code> (left arrow)</td><td>Previous question</td><td>Test questions</td></tr>
        <tr><td><code>Esc</code></td><td>Finish the test</td><td>Test questions</td></tr>
        <tr><td><code>Tab</code></td><td>Move between elements</td><td>Every page</td></tr>
        <tr><td><code>Enter</code></td><td>Confirm / activate the focused element</td><td>Every page</td></tr>
      </tbody>
    </table>
    <h4>Important notes</h4>
    <ul>
      <li>Shortcuts do not fire when focus is inside a text field.</li>
      <li>In the Arabic (RTL) interface, the left arrow means "next" and the right arrow means "previous".</li>
      <li>Shortcuts work with screen readers too.</li>
    </ul>
    <h4>Touch navigation (mobile)</h4>
    <ul>
      <li><strong>Swipe left:</strong> next question</li>
      <li><strong>Swipe right:</strong> previous question</li>
      <li>The swipe must cover at least 50 pixels</li>
    </ul>`
    },

    {
      id: 'themes',
      num: 21,
      icon: 'bi bi-palette',
      title: 'Themes and appearance',
      content: `<p>The system offers <strong>four visual themes</strong> to match your preference and lighting conditions.</p>
    <h4>Available themes</h4>
    <table class="table-shared">
      <thead>
        <tr><th>Theme</th><th>Description</th><th>Best for</th></tr>
      </thead>
      <tbody>
        <tr><td>Light ☀️</td><td>Warm beige / brown</td><td>Daytime use</td></tr>
        <tr><td>Dark 🌙</td><td>Dark background with light text</td><td>Night-time use</td></tr>
        <tr><td>Blossom 🌸</td><td>Soft pink tones</td><td>A calm, warm look</td></tr>
        <tr><td>Fresh 🌳</td><td>Natural greens</td><td>A relaxing, natural look</td></tr>
      </tbody>
    </table>
    <h4>Changing the theme</h4>
    <ol>
      <li>Click the theme icon in the top navigation bar.</li>
      <li>A dropdown with the four themes appears.</li>
      <li>Click the theme you want.</li>
      <li>The theme is applied instantly with a smooth transition.</li>
    </ol>
    <h4>Saving the preference</h4>
    <ul>
      <li>The theme is saved locally in your browser.</li>
      <li>It loads instantly on every visit.</li>
    </ul>
    <h4>Smooth transition</h4>
    <p>When you change the theme, a 350 ms transition is applied to all colours, borders, and shadows, avoiding a jarring flash.</p>`
    },

    {
      id: 'offline',
      num: 22,
      icon: 'bi bi-wifi-off',
      title: 'Offline mode',
      content: `<p>The system <strong>detects the network state</strong> and shows a banner when the connection drops.</p>
    <h4>What happens when the connection drops?</h4>
    <ol>
      <li>A <strong>red banner</strong> appears at the top of the page: "You are offline".</li>
      <li>You can keep browsing pages that are already loaded.</li>
      <li>Operations that need the network (save, load) fail with an error message.</li>
    </ol>
    <h4>What happens when the connection returns?</h4>
    <ol>
      <li>The warning banner disappears automatically.</li>
      <li>You can keep working normally.</li>
    </ol>
    <h4>What works offline</h4>
    <ul>
      <li>Browsing pages that are already loaded</li>
      <li>Reading the questions shown</li>
      <li>Moving between loaded pages</li>
    </ul>
    <h4>What does not work offline</h4>
    <ul>
      <li>Saving new or edited questions</li>
      <li>Starting new tests</li>
      <li>Refreshing data</li>
      <li>Signing in / out</li>
    </ul>`
    },

    {
      id: 'privacy',
      num: 23,
      icon: 'bi bi-shield-lock',
      title: 'Privacy and security',
      content: `<p>Mukhtabir handles sensitive data. Please read the full <a href="/privacy">privacy policy</a> for complete details. The system is subject to Syrian Law No. 12 of 2024 on the Protection of Electronic Personal Data, and we are guided by the principles of the EU General Data Protection Regulation (GDPR) where possible.</p>
    <h4>Security measures in place</h4>
    <ul>
      <li><strong>Password hashing:</strong> all passwords are hashed using PBKDF2-SHA256</li>
      <li><strong>CSRF protection:</strong> all requests are protected with CSRF tokens</li>
      <li><strong>Rate limiting:</strong> at most 5 sign-in attempts per minute</li>
      <li><strong>Account lockout:</strong> after 5 failed attempts, the account is locked for 15 minutes</li>
      <li><strong>Secure sessions:</strong> HttpOnly and SameSite cookies</li>
    </ul>
    <h4>Security tips for users</h4>
    <ul>
      <li>Never share your password with anyone</li>
      <li>Sign out when using a shared device</li>
      <li>Change your password immediately if you suspect compromise</li>
      <li>Report suspicious activity to the administrator</li>
    </ul>
    <h4>Data we collect</h4>
    <ul>
      <li>Username and full name</li>
      <li>IP address and activity logs</li>
      <li>Published questions and answers</li>
      <li>Theme preferences</li>
    </ul>
    <h4>Your rights</h4>
    <ul>
      <li>Request access to your data</li>
      <li>Request correction of inaccurate data</li>
      <li>Request deletion of your account (via the administrator)</li>
      <li>Withdraw consent at any time</li>
      <li>Contact about privacy: <strong>hjjarmhmmdali@gmail.com</strong></li>
    </ul>`
    },

    {
      id: 'accessibility',
      num: 24,
      icon: 'bi bi-universal-access',
      title: 'Accessibility',
      content: `<p>The system is designed to be <strong>usable by everyone</strong>, including users with disabilities.</p>
    <h4>Supported features</h4>
    <ul>
      <li><strong>Screen readers:</strong> all interactive elements have ARIA labels</li>
      <li><strong>Keyboard navigation:</strong> every function is reachable via Tab and Enter</li>
      <li><strong>Focus trap:</strong> inside modals, focus stays within the modal</li>
      <li><strong>Announcements:</strong> an aria-live region announces theme changes and messages</li>
      <li><strong>Skip link:</strong> "Skip to main content" at the top of the page</li>
      <li><strong>Colour contrast:</strong> all themes meet WCAG AA</li>
      <li><strong>Touch targets:</strong> all buttons are at least 44×44 pixels</li>
      <li><strong>Reduced motion:</strong> respects the prefers-reduced-motion setting</li>
    </ul>
    <h4>Accessibility shortcuts</h4>
    <ul>
      <li><code>Tab</code>: move between elements</li>
      <li><code>Shift+Tab</code>: move backwards</li>
      <li><code>Enter</code> or <code>Space</code>: activate the focused element</li>
      <li><code>Esc</code>: close modals</li>
    </ul>`
    },

    {
      id: 'faq',
      num: 25,
      icon: 'bi bi-question-octagon',
      title: 'FAQ',
      content: `<h4>How do I change my password?</h4>
    <p>From the user menu (top right) → <strong>Change password</strong>. Enter your current password, then the new one (at least 8 characters).</p>
    <h4>How do I report a wrong question?</h4>
    <p>Click the 🚩 icon next to the question. You can add a reason. The report goes to the administrator for review.</p>
    <h4>Can I resume a paused test?</h4>
    <p>Yes. In <strong>exam and self-study</strong>, a "Continue where you left off" card appears on the Dashboard. Click "Resume" to continue.</p>
    <h4>How do I export questions?</h4>
    <p>From Admin → Database → Export. Choose the format (Excel / CSV / JSON).</p>
    <h4>Why can't I verify my own question?</h4>
    <p>This is deliberate, to protect verification quality. Another doctor or an admin must verify your question.</p>
    <h4>What is the trust score?</h4>
    <p>The percentage of your questions that have been verified. It is shown on your profile and updates automatically.</p>
    <h4>Can I use the system on my phone?</h4>
    <p>Yes. The system is fully responsive. On small screens a bottom navigation bar replaces the top one.</p>
    <h4>What happens when my account expires?</h4>
    <p>If auto-renewal is on, the account is extended automatically. If not, the account is deactivated until the administrator intervenes.</p>
    <h4>How do I add a new tag?</h4>
    <p>When adding or editing a question, type the tag into the tag field. If it does not exist yet, it is created automatically.</p>
    <h4>Can I delete my own account?</h4>
    <p>No. Account deletion requires administrator intervention. Contact the administrator at <strong>hjjarmhmmdali@gmail.com</strong> if you want your account deleted.</p>`
    },

    {
      id: 'troubleshooting',
      num: 26,
      icon: 'bi bi-tools',
      title: 'Troubleshooting',
      content: `<h4>I can't sign in</h4>
    <ul>
      <li>Check the username and password (case-sensitive)</li>
      <li>Your account may be deactivated or expired</li>
      <li>If you exceeded 5 failed attempts, wait 15 minutes</li>
      <li>If you forgot your password, ask the administrator to reset it</li>
    </ul>
    <h4>The page is not working properly</h4>
    <ul>
      <li>Reload the page (<code>Ctrl+F5</code> or <code>Cmd+Shift+R</code>)</li>
      <li>Clear the browser cache</li>
      <li>Check your internet connection</li>
      <li>Try another browser</li>
    </ul>
    <h4>Questions are not showing up</h4>
    <ul>
      <li>Check the active filters — they may be too restrictive</li>
      <li>Click "Reset" to clear all filters</li>
      <li>Confirm that questions actually exist in the system</li>
    </ul>
    <h4>The test does not start</h4>
    <ul>
      <li>Confirm that you selected a tag or another source</li>
      <li>Confirm that questions match the criteria</li>
      <li>Try loosening the filters</li>
    </ul>
    <h4>The timer is not running</h4>
    <ul>
      <li>Confirm you are in exam or self-study mode</li>
      <li>Check the exam-duration setting (admins only)</li>
    </ul>
    <h4>Images are not showing up in Markdown</h4>
    <ul>
      <li>Check the image URL</li>
      <li>Confirm the URL starts with https://</li>
      <li>Some sites block hotlinking</li>
    </ul>
    <h4>When should I contact the administrator?</h4>
    <ul>
      <li>Persistent sign-in problems</li>
      <li>Account expiry</li>
      <li>System errors you cannot resolve yourself</li>
      <li>Requests to create new accounts</li>
    </ul>
    <p>Contact: <strong>hjjarmhmmdali@gmail.com</strong></p>`
    },

    {
      id: 'glossary',
      num: 27,
      icon: 'bi bi-book-half',
      title: 'Glossary',
      content: `<table class="table-shared">
      <thead>
        <tr><th>Term</th><th>Definition</th></tr>
      </thead>
      <tbody>
        <tr><td>Question</td><td>The core unit of content — text + choices + correct answer + explanation</td></tr>
        <tr><td>Category</td><td>A top-level group of questions (for example, Mood Disorders)</td></tr>
        <tr><td>Tag</td><td>A keyword attached to a question to make it easier to find</td></tr>
        <tr><td>Verification</td><td>The process of reviewing a question for accuracy</td></tr>
        <tr><td>Trust score</td><td>The ratio of a user's verified questions to their total questions</td></tr>
        <tr><td>Exam</td><td>A timed test mode that simulates a real exam</td></tr>
        <tr><td>Self-study</td><td>A learning mode with an immediate explanation per question and multiple filters</td></tr>
        <tr><td>Bookmarks</td><td>A list of saved questions to come back to</td></tr>
        <tr><td>Report</td><td>A notice to the administrator about a question that contains an error</td></tr>
        <tr><td>Backup</td><td>A copy of the database for protection against loss</td></tr>
        <tr><td>Validity</td><td>How long an account remains active before expiring</td></tr>
        <tr><td>Auto-renew</td><td>Automatic extension of account validity at expiry</td></tr>
        <tr><td>Theme</td><td>The visual appearance of the app (light, dark, blossom, fresh)</td></tr>
        <tr><td>Markdown</td><td>A lightweight formatting language used to author questions</td></tr>
        <tr><td>Session</td><td>One test from start to finish</td></tr>
        <tr><td>Pause</td><td>Saving test progress to come back to later</td></tr>
      </tbody>
    </table>`
    }
  ]
}