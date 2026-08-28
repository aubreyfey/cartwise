/**
 * What CartWise knows about you, and who else's work is in it.
 *
 * Both halves are obligations rather than decoration. The privacy half is what
 * anyone shipping an app is expected to be able to point at; the attribution
 * half is a licence condition of the data CartWise ships — Open Food Facts and
 * OpenStreetMap are both ODbL, which requires credit. catalogue.js has said
 * "see the note in Settings" since the catalogue was added, and until now
 * there was no such note.
 *
 * Written as plain sentences on purpose. A privacy policy nobody can read is
 * a policy in name only.
 */
export default function AboutScreen({ contributing = false }) {
  return (
    <div className="about">
      <header className="screen-head">
        <h1 className="screen-head__title">Privacy &amp; credits</h1>
      </header>

      <section className="about__section">
        <h2 className="about__head">Where your shopping lives</h2>
        <p>
          On this device, in this browser. Your lists, your prices, your Vault,
          your trips, your photos and the locations you save for shops are all
          stored locally. CartWise has no account, no sign-in and no server that
          holds your shopping.
        </p>
        <p>
          That also means nobody can recover it for you. Clearing your browser
          data erases it, so <strong>Backup → Save a copy</strong> in Settings is
          the only safety net there is.
        </p>
      </section>

      <section className="about__section">
        <h2 className="about__head">What can leave this device</h2>
        <p>
          One thing, and only if you switch it on:{' '}
          <strong>community prices</strong>. It is off unless you turn it on
          {contributing ? ' — you have it on at the moment' : ' — you have it off at the moment'}.
        </p>
        <p>When it is on, a price you record is sent as five things:</p>
        <ul className="about__list">
          <li>the product name</li>
          <li>the shop name you typed</li>
          <li>the price and unit</li>
          <li>the currency</li>
          <li>the date — the day, not the time</li>
        </ul>
        <p>
          There is no account attached, no device identifier, no list, no trip,
          and no coordinate. The database column that holds the date can only
          store a day, so a precise time cannot be recorded even by accident.
        </p>
        <p>
          Shop locations you save are used on your map and to sort shops by
          distance. They are never sent anywhere.
        </p>
      </section>

      <section className="about__section">
        <h2 className="about__head">What CartWise never does</h2>
        <ul className="about__list">
          <li>No analytics, trackers or advertising SDKs.</li>
          <li>No selling or sharing of your shopping with anyone.</li>
          <li>No background location. It is asked for only when you tap for it.</li>
          <li>
            No live shelf prices. Every price you see is one you or another
            contributor recorded — CartWise has no feed from any shop.
          </li>
        </ul>
      </section>

      <section className="about__section">
        <h2 className="about__head">Whose work is in here</h2>

        <h3 className="about__sub">Product catalogue</h3>
        <p>
          Product names, brands, pack sizes and barcodes come from{' '}
          <a href="https://openfoodfacts.org" target="_blank" rel="noreferrer noopener">
            Open Food Facts
          </a>
          , © Open Food Facts contributors, made available under the{' '}
          <a
            href="https://opendatacommons.org/licenses/odbl/1-0/"
            target="_blank"
            rel="noreferrer noopener"
          >
            Open Database Licence 1.0
          </a>
          . CartWise ships a copy of that data; the licence is share-alike, so
          any improved version of the database itself is offered back under the
          same terms.
        </p>

        <h3 className="about__sub">Maps</h3>
        <p>
          Map tiles are © {' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer noopener"
          >
            OpenStreetMap
          </a>{' '}
          contributors, also under ODbL 1.0. Tiles are requested from
          openstreetmap.org when you open the map — that request necessarily
          tells them roughly which part of the world you are looking at, which
          is the one screen in CartWise that talks to anyone.
        </p>

        <h3 className="about__sub">Software</h3>
        <p>
          Maps are drawn with Leaflet (BSD 2-Clause) and barcodes read with
          ZXing (Apache 2.0). Both are loaded only on the screens that use them.
        </p>
      </section>

      <section className="about__section">
        <h2 className="about__head">This build</h2>
        <p className="about__build">
          <code>{typeof __BUILD_STAMP__ === 'string' ? __BUILD_STAMP__ : 'dev'}</code>
        </p>
      </section>
    </div>
  )
}
