import React from 'react';

const MDXComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      className="font-serif italic text-3xl md:text-4xl text-[#1a1a1a] mt-10 mb-4 leading-tight"
      {...props}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="font-serif italic text-2xl md:text-3xl text-[#1a1a1a] mt-8 mb-3 leading-tight"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="font-sans text-xl md:text-2xl font-semibold text-[#1a1a1a] mt-6 mb-2"
      {...props}
    />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      className="font-sans text-lg md:text-xl font-semibold text-[#1a1a1a] mt-5 mb-2"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className="font-sans text-base md:text-lg text-[#333] leading-relaxed mb-5"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="font-sans text-base md:text-lg text-[#333] leading-relaxed mb-5 pl-6 list-disc space-y-2"
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className="font-sans text-base md:text-lg text-[#333] leading-relaxed mb-5 pl-6 list-decimal space-y-2"
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="pl-1" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-[#DE3F5E] pl-5 my-6 italic text-[#4a4a4a] text-base md:text-lg"
      {...props}
    />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-[#DE3F5E] hover:text-[#C8365A] underline underline-offset-2 transition-colors"
      target={props.href?.startsWith('http') ? '_blank' : undefined}
      rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    />
  ),
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="rounded-xl my-6 w-full"
      alt={props.alt ?? ''}
      {...props}
    />
  ),
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-8 border-t border-[#e0e0e0]" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-[#1a1a1a]" {...props} />
  ),
};

export default MDXComponents;
