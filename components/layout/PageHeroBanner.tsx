import { MessageCircleCode } from "lucide-react";
import Link from "next/link";
import React from "react";

const PageHeroBanner = ({
  title,
  imageUrl,
  description,
}: {
  title: string;
  imageUrl: string;
  description: string;
}) => {
  return (
    <div className="w-full flex flex-row justify-start items-start gap-0">
      <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
      <div className="absolute -top-30 -right-30 w-150 h-150 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

      <div className="w-full lg:w-1/2 bg-[#162238] flex flex-col justify-center items-start py-0 px-6 lg:px-46 h-101 lg:h-140 gap-6">
        <h2 className="text-[calc(1em+2.5vw)] capitalize font-playfair font-medium leading-11.5 tracking-normal text-white">
          {title}
        </h2>
        <p className="text-white font-jakata text-base">{description}</p>
        {title !== "contacts us" && (
          <Link
            href="/contact"
            className="py-4.5 px-5 bg-[#b1ddff] inline-flex justify-center gap-4 text-center font-jakata font-semibold text-base text-[#203253] rounded-[10px] w-full lg:w-60"
          >
            Contact Us <MessageCircleCode />
          </Link>
        )}
      </div>

      <div
        className="hidden lg:flex lg:w-1/2  bg-cover bg-no-repeat bg-center h-140"
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
      />
    </div>
  );
};

export default PageHeroBanner;
