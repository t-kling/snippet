import Header from '../components/Header';

function About() {
  return (
    <div>
      <Header />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 40px' }}>
        <h2 style={{ marginBottom: '30px', color: 'var(--text-primary)' }}>About Snippet</h2>

        <div style={{
          padding: '30px',
          backgroundColor: 'var(--bg-secondary)',
          border: '2px solid var(--border-color)',
          borderRadius: '8px',
          lineHeight: '1.8',
          fontSize: '16px',
          color: 'var(--text-primary)',
        }}>
          <p style={{ marginTop: 0 }}>
            Snippet is a companion for readers who bite off more than they can chew. We're here to help you retain the highlights of a narrative or the core of an argument. Copy in text, images, and LaTeX equations from anywhere you study, paraphrase or pare them down, and review on your own terms.
          </p>

          <p>
            Snippet's primary learning tools are <em>spaced repetition</em> and <em>Cloze deletion.</em> Spaced repetition, active in Study mode, ensures you study the snippets you're most likely to forget first. When you rate a snippet's difficulty, it is automatically scheduled for review based on your comprehension. Cloze deletion hides key words in a text so you can quiz yourself, turning passive reading into active, memory-enhancing recall.
          </p>

          <p>
            Snippet is inspired by Anki and Incremental Reading. However, rather than an all-encompassing study environment, we aim to do one thing beautifully.
          </p>

          <h3 style={{ marginTop: '30px', marginBottom: '15px', color: 'var(--text-primary)' }}>Suggestions:</h3>
          <ul style={{ paddingLeft: '25px', marginBottom: 0 }}>
            <li style={{ marginBottom: '12px' }}>
              Keep Cloze deletions small for easiest memorization - a single word or key phrase works best.
            </li>
            <li style={{ marginBottom: '12px' }}>
              If you're struggling to remember a complicated snippet, make a copy and simplify its wording. Consider keeping both snippets in your queue–redundancy boosts memory.
            </li>
            <li style={{ marginBottom: '12px' }}>
              Mark cards 'to edit' liberally during quick capture—you can refine them later in batch from the Library view.
            </li>
            <li style={{ marginBottom: '12px' }}>
              Remove cards from queue temporarily if they're not relevant to current goals. You can always add them back later.
            </li>
            <li style={{ marginBottom: '12px' }}>
              Use built-in OCR to transcribe screenshots and photos of paper books.
            </li>
            <li style={{ marginBottom: '12px' }}>
              Add cloze boxes to diagrams and screenshots to test visual recall—perfect for anatomy, maps, or technical diagrams.
            </li>
            <li style={{ marginBottom: '12px' }}>
              Memorize formulas easily by cloze-deleting individual terms inside LaTeX equations.
            </li>
            <li style={{ marginBottom: '12px' }}>
              Record conversations, ideas, dreams, and the entrails of birds as Original cards.
            </li>
            <li style={{ marginBottom: '12px' }}>
              Keep your favorite poetry and quotes in an #inspiration topic to browse in Appreciation Mode.
            </li>
            <li style={{ marginBottom: 0 }}>
              Export your library regularly as backup (Settings → Download Library).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default About;
