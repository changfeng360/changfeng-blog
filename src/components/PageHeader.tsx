type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
}: PageHeaderProps) {
  return (
    <header className="mx-auto max-w-3xl px-5 pt-32 text-center sm:px-8 sm:pt-40">
      <span className="chip pixel-font mb-5 !text-[12px] text-accent-blue">
        {eyebrow}
      </span>
      <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
        {description}
      </p>
    </header>
  );
}
