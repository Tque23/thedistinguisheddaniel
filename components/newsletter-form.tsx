"use client";

import { useActionState } from "react";
import { subscribeToNewsletter, type NewsletterState } from "@/components/newsletter-action";

const initialState: NewsletterState = { status: "idle", message: "" };

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialState);

  return (
    <div id="Earlyaccess" className="section-px py-16 md:py-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#c89b3c] to-[#f3d27a]" />

        <div className="flex flex-col gap-3">
          <h2
            style={{ fontFamily: '"Trajan Pro 3", serif' }}
            className="text-3xl font-normal tracking-tight text-white text-balance md:text-5xl"
          >
            Sign up to the newsletter
          </h2>
          <p className="text-base text-white/60 text-pretty md:text-lg">
            Be the first to hear about the launch, new lectures, and updates from the network.
          </p>
        </div>

        {state.status === "success" ? (
          <p role="status" className="text-base font-medium text-[#f3d27a]">
            {state.message}
          </p>
        ) : (
          <form
            action={formAction}
            className="flex w-full max-w-md flex-col items-stretch gap-6 sm:flex-row sm:items-end sm:gap-4"
            noValidate
          >
            <div className="flex-1 text-left">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={state.status === "error"}
                aria-describedby={state.status === "error" ? "newsletter-error" : undefined}
                className="w-full border-0 border-b border-white/20 bg-transparent px-0.5 pb-2 text-white placeholder:text-white/40 outline-none transition-colors focus:border-[#f3d27a]"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="shrink-0 border-b border-[#f3d27a] pb-2 text-sm font-semibold uppercase tracking-wider text-[#f3d27a] transition-opacity hover:opacity-75 disabled:opacity-50"
            >
              {pending ? "Signing up..." : "Sign Up"}
            </button>
          </form>
        )}

        {state.status === "error" && (
          <p id="newsletter-error" role="alert" className="text-sm text-red-300">
            {state.message}
          </p>
        )}

        <div className="h-px w-16 bg-gradient-to-r from-[#f3d27a] via-[#c89b3c] to-transparent" />
      </div>
    </div>
  );
}
