"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "sniper-link": any;
    }
  }
}

export default function Demo() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const blogPost = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!blogPost.current) {
      return;
    }

    blogPost.current.scrollTop = blogPost.current.scrollHeight;
    blogPost.current.classList.remove("opacity-0");
  }, []);

  return (
    <div className="relative">
      <div className="bg-white ring-1 ring-gray-950/5 rounded-lg shadow-lg border border-gray-200">
        <div className="px-4 py-2 border-b bg-gray-50 rounded-t-lg border-gray-200 flex gap-x-1.5 items-center flex">
          <div className="h-3 w-3 rounded-full bg-[#ff5f57] border border-[#e2524e]" />
          <div className="h-3 w-3 rounded-full bg-[#febc2d] border border-[#dba647]" />
          <div className="h-3 w-3 rounded-full bg-[#27ca41] border border-[#37ac52]" />
          <div className="font-semibold text-gray-800 flex-1 text-center">
            Demo
          </div>
          <div className="w-9" />
        </div>

        <div className="overflow-hidden relative">
          <div
            className="p-4 ml-0.5 space-y-2 overflow-scroll [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] opacity-0 transition-opacity"
            ref={blogPost}
          >
            <p className="font-serif text-gray-500">
              You know how life has its unexpected twists and turns, right? We
              all have those moments where we think we’ve got everything under
              control and then bam! Out of nowhere, the universe serves us a
              slice of humble pie. It’s like that time I tried to multi-task.
            </p>
            <p className="font-serif text-gray-500">
              It was truly one of the formative experiences of my adolescence,
              which shaped me into who I am today. From that day on, I swore to
              never chew gum while petting a dog, for one can never know what
              will happen.
            </p>
          </div>

          <div className="absolute inset-x-0 top-0 h-12 w-full bg-gradient-to-b from-white to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-6 w-full bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="px-4 pb-4">
          <div className="bg-gray-900 p-2.5 rounded-md">
            <p className="text-sm font-bold text-white">
              Sign up for our newsletter!
            </p>
            {!submitted ? (
              <form
                onSubmit={onSubmit}
                className="mt-1.5 grid grid-cols-[1fr,max-content] gap-x-2 space-y-2"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full text-sm bg-gray-800 rounded border-gray-700 focus:border-gray-600 focus:bg-gray-700 focus:ring-0 text-white placeholder:text-gray-500 py-1.5 px-2 transition-colors"
                />
                <button className="block font-bold bg-green-500 py-1 text-sm text-white rounded px-2 h-full hover:bg-green-600 transition-colors">
                  Subscribe
                </button>
              </form>
            ) : (
              <div className="mt-2 scale-75 origin-top-left -mb-2">
                <div className="demo__container">
                  {/* @ts-ignore */}
                  <sniper-link
                    recipient={email}
                    sender="justin@buttondown.email"
                    template="Confirm your email in {provider}"
                    disable-tracking
                  />
                  <p className="hidden text-gray-200">
                    Whoops! We couldn’t show a button for {email}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Script src="/v1/sniper-link.js" />
    </div>
  );
}
