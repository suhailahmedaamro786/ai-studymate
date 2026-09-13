"use client";

import Image from "next/image";
import { TEAM_MEMBERS, TEAM_SECTION } from "@/lib/team-data";
import { Avatar } from "@/components/ui/avatar";

export function TeamSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            {TEAM_SECTION.title}
          </h2>
          <p className="text-lg text-muted-foreground">{TEAM_SECTION.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.name}
              className={`
                group relative bg-card rounded-xl border p-6 text-center
                transition-all duration-300 hover:shadow-lg hover:shadow-primary/5
                hover:-translate-y-1
                ${member.isLeader ? "ring-2 ring-primary/20 shadow-md shadow-primary/5" : ""}
              `}
            >
              {member.isLeader && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground shadow-sm">
                    Student Leader
                  </span>
                </div>
              )}

              <div className="flex justify-center mb-4">
                <div className="relative h-20 w-20 group-hover:scale-105 transition-transform duration-300">
                  <Avatar
                    src={member.image}
                    alt={`Photo of ${member.name}`}
                    initials={member.initials}
                    className="h-20 w-20 text-lg"
                  />
                </div>
              </div>

              <h3 className="font-semibold text-base mb-1 text-card-foreground">
                {member.name}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {member.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
