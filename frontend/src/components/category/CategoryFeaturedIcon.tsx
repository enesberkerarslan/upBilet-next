type IconKind = "football" | "basketball" | "concert" | "theater" | "standup" | "default";

export function categoryIconForSlug(slug: string): IconKind {
  const s = slug.toLowerCase();
  if (s === "futbol") return "football";
  if (s === "basketbol") return "basketball";
  if (s === "konser") return "concert";
  if (s === "tiyatro") return "theater";
  if (s === "standup") return "standup";
  return "default";
}

export function CategoryFeaturedIcon({ kind }: { kind: IconKind }) {
  if (kind === "football") {
    return (
      <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1.66667 7.64284C1.66667 5.84701 1.66667 4.9491 2.15483 4.3912C2.64298 3.83331 3.42866 3.83331 5.00001 3.83331H15C16.5713 3.83331 17.357 3.83331 17.8452 4.3912C18.3333 4.9491 18.3333 5.84701 18.3333 7.64284V13.3571C18.3333 15.153 18.3333 16.0509 17.8452 16.6087C17.357 17.1666 16.5713 17.1666 15 17.1666H5.00001C3.42866 17.1666 2.64298 17.1666 2.15483 16.6087C1.66667 16.0509 1.66667 15.153 1.66667 13.3571V7.64284Z"
          stroke="#00A63E"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M9.99999 12.1666C10.9205 12.1666 11.6667 11.4205 11.6667 10.5C11.6667 9.57951 10.9205 8.83331 9.99999 8.83331C9.07952 8.83331 8.33333 9.57951 8.33333 10.5C8.33333 11.4205 9.07952 12.1666 9.99999 12.1666Z"
          stroke="#00A63E"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M10 8.83335V4.66669M10 12.1667V16.3334" stroke="#00A63E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M18.3333 8H16.25C15.7898 8 15.4167 8.3731 15.4167 8.83333V12.1667C15.4167 12.6269 15.7898 13 16.25 13H18.3333"
          stroke="#00A63E"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M1.66667 8H3.75001C4.21024 8 4.58334 8.3731 4.58334 8.83333V12.1667C4.58334 12.6269 4.21024 13 3.75001 13H1.66667"
          stroke="#00A63E"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "basketball") {
    return (
      <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M18.3333 10.5C18.3333 15.1023 14.6023 18.8333 10 18.8333C5.39763 18.8333 1.66667 15.1023 1.66667 10.5C1.66667 5.89758 5.39763 2.16663 10 2.16663C14.6023 2.16663 18.3333 5.89758 18.3333 10.5Z"
          stroke="#FF6900"
          strokeWidth="1.5"
        />
        <path d="M1.66667 11.2921C6.78761 11.8005 11.2981 7.26227 10.7922 2.16663" stroke="#FF6900" strokeWidth="1.5" />
        <path d="M9.20891 18.8344C8.7005 13.7134 13.2388 9.20286 18.3344 9.70877" stroke="#FF6900" strokeWidth="1.5" />
        <path d="M14.1667 17.1667C14.1667 11.1836 9.31641 6.33337 3.33333 6.33337" stroke="#FF6900" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "concert") {
    return (
      <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 2.16669L12.5 7.16669L18.3333 8.16669L14.1667 12.1667L15.1667 18.1667L10 15.1667L4.83333 18.1667L5.83333 12.1667L1.66667 8.16669L7.5 7.16669L10 2.16669Z"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "theater") {
    return (
      <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3.33333 6.16669H16.6667V14.1667C16.6667 15.7269 15.3936 17 13.8333 17H6.16667C4.60643 17 3.33333 15.7269 3.33333 14.1667V6.16669Z"
          stroke="#EC4899"
          strokeWidth="1.5"
        />
        <path d="M1.66667 6.16669H18.3333" stroke="#EC4899" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M7.5 9.16669C7.5 9.71897 7.05228 10.1667 6.5 10.1667C5.94772 10.1667 5.5 9.71897 5.5 9.16669C5.5 8.6144 5.94772 8.16669 6.5 8.16669C7.05228 8.16669 7.5 8.6144 7.5 9.16669Z"
          fill="#EC4899"
        />
        <path
          d="M14.5 9.16669C14.5 9.71897 14.0523 10.1667 13.5 10.1667C12.9477 10.1667 12.5 9.71897 12.5 9.16669C12.5 8.6144 12.9477 8.16669 13.5 8.16669C14.0523 8.16669 14.5 8.6144 14.5 9.16669Z"
          fill="#EC4899"
        />
        <path
          d="M10 12.1667C10.5523 12.1667 11 11.719 11 11.1667C11 10.6144 10.5523 10.1667 10 10.1667C9.44772 10.1667 9 10.6144 9 11.1667C9 11.719 9.44772 12.1667 10 12.1667Z"
          fill="#EC4899"
        />
      </svg>
    );
  }
  if (kind === "standup") {
    return (
      <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 2.16669C12.7614 2.16669 15 4.40525 15 7.16669C15 9.92813 12.7614 12.1667 10 12.1667C7.23858 12.1667 5 9.92813 5 7.16669C5 4.40525 7.23858 2.16669 10 2.16669Z"
          stroke="#F59E0B"
          strokeWidth="1.5"
        />
        <path
          d="M3.33333 17.1667C3.33333 14.4052 5.5719 12.1667 8.33333 12.1667H11.6667C14.4281 12.1667 16.6667 14.4052 16.6667 17.1667"
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 2.16669L12.5 7.16669L18.3333 8.16669L14.1667 12.1667L15.1667 18.1667L10 15.1667L4.83333 18.1667L5.83333 12.1667L1.66667 8.16669L7.5 7.16669L10 2.16669Z"
        stroke="#FFD700"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#FFD700"
      />
    </svg>
  );
}
