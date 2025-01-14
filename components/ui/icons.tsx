"use client"

import * as React from "react"
import { LucideProps } from "lucide-react"

export const Icons = {
  ethereum: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L3 12l9 4.5L21 12 12 2z" />
      <path d="M12 6.5l-9 5.5 9 4.5 9-4.5-9-5.5z" />
    </svg>
  ),
} 