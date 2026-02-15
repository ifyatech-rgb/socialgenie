"use client";

import React from "react";

export function ContainerScroll({
  titleComponent,
  children,
}: {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="h-[60rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20">
      <div className="py-10 md:py-40 w-full relative">
        <div className="max-w-5xl mx-auto text-center">
          {titleComponent}
        </div>
        <div
          className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-4 border-[#667eea] p-2 md:p-6 bg-[#0a0a0a] rounded-[30px] shadow-2xl"
          style={{
            boxShadow:
              "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
          }}
        >
          <div className="h-full w-full overflow-hidden rounded-2xl bg-black md:rounded-2xl md:p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
