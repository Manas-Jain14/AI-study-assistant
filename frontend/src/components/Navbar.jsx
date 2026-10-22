// Top bar showing the current page title. Each page passes its own title in.
function Navbar({ title }) {
  return (
    <header className="h-16 border-b border-border flex items-center px-8 shrink-0">
      <h1 className="text-textPrimary text-lg font-semibold">{title}</h1>
    </header>
  );
}

export default Navbar;
