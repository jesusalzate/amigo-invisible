import { interestById } from "@/lib/interests";
import type { Profile } from "@/lib/data";

/** Read-only view of someone's tastes, shown to the person who gives them a gift. */
export function ProfileView({ profile }: { profile: Profile }) {
  const empty =
    profile.interests.length === 0 && !profile.likes && !profile.dislikes && !profile.sizes;

  if (empty) {
    return (
      <div className="list">
        <p className="row t-subhead text-label2">
          {profile.name} todavía no ha puesto sus gustos. Vuelve a mirar en unos días.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {profile.interests.length > 0 && (
        <section>
          <h3 className="section-header">Le interesa</h3>
          <ul className="flex flex-wrap gap-2 px-1">
            {profile.interests.map((id) => {
              const i = interestById(id);
              return i ? (
                <li key={id} className="tag">
                  <span aria-hidden>{i.emoji}</span>
                  {i.label}
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}
      <TextBlock label="Le encanta" value={profile.likes} />
      <TextBlock label="Mejor no le regales" value={profile.dislikes} />
      <TextBlock label="Tallas y datos útiles" value={profile.sizes} />
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <section>
      <h3 className="section-header">{label}</h3>
      <div className="list">
        <p className="row whitespace-pre-line">{value}</p>
      </div>
    </section>
  );
}
