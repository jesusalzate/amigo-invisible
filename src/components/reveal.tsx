"use client";

import { useState, useSyncExternalStore } from "react";
import { Bow } from "./scene";

const noopSubscribe = () => () => {};

/** A wrapped gift with a paper tag. Purely presentational. */
export function GiftBox({
  open = false,
  tag,
}: {
  open?: boolean;
  tag: React.ReactNode;
}) {
  return (
    <div className="gift" data-open={open}>
      <Bow className="gift-bow" />
      <div className="gift-box">
        <div className="gift-lid" />
        <div className="gift-ribbon-v" />
        <div className="gift-ribbon-h" />
        <div className="relative flex min-h-56 items-center justify-center px-6 pb-8 pt-20">
          {tag}
        </div>
      </div>
    </div>
  );
}

/**
 * The signature moment: tap the gift to unwrap it and find who you got.
 * Opened state is remembered per device so it stays open on later visits.
 */
export function Reveal({
  storageKey,
  name,
  avatar,
  children,
}: {
  storageKey: string;
  name: string;
  avatar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [clicked, setClicked] = useState(false);
  const stored = useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return localStorage.getItem(storageKey) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );
  const open = clicked || stored;

  function openIt() {
    setClicked(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {}
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={openIt}
        disabled={open}
        aria-expanded={open}
        aria-label={open ? `Te ha tocado ${name}` : "Abrir el regalo para ver a quién te ha tocado"}
        className="focus-ring block w-full rounded-[1.25rem] text-left disabled:cursor-default"
      >
        <GiftBox
          open={open}
          tag={
            open ? (
              <div className="gift-tag reveal-in w-full max-w-72 px-6 pb-5 pt-7 text-center">
                {avatar}
                <p className="t-subhead opacity-80">Te ha tocado</p>
                <p className="t-large-title break-words">{name}</p>
              </div>
            ) : (
              <div className="gift-tag gift-tag-wiggle px-6 pb-4 pt-7 text-center">
                <p className="t-headline">Toca para abrir</p>
                <p className="t-footnote opacity-80">Tu amigo invisible está dentro</p>
              </div>
            )
          }
        />
      </button>
      {open && <div className="reveal-in">{children}</div>}
    </div>
  );
}
