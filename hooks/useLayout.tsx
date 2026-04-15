import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import React, { ComponentType } from "react";

const withLayout = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const LayoutComponent = (props: P) => (
      <main className="flex flex-col items-start justify-start min-h-screen w-full relative">
      <Navbar />
       <WrappedComponent {...props} />
      <Footer />
    </main>
  );

  return LayoutComponent;
};

export default withLayout;
