@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --brand: #C0271A;
  --brand-dark: #8F1A10;
  --brand-light: #FCEBEB;
}

* {
  box-sizing: border-box;
}

body {
  background: #f9f9f8;
}

/* Scrollbar sutil */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
