import type { SVGProps } from 'react';

export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & {
  name:
    | 'dashboard'
    | 'tasks'
    | 'phone'
    | 'mail'
    | 'bot'
    | 'settings'
    | 'plus'
    | 'search'
    | 'chevronDown'
    | 'check'
    | 'clock'
    | 'spark';
}) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg'
  } as const;

  switch (name) {
    case 'dashboard':
      return (
        <svg {...common} {...props}>
          <path
            d="M4 13h7V4H4v9Zm9 7h7V11h-7v9ZM4 20h7v-5H4v5Zm9-11h7V4h-7v5Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'tasks':
      return (
        <svg {...common} {...props}>
          <path
            d="M9 6h11v2H9V6Zm0 5h11v2H9v-2Zm0 5h11v2H9v-2ZM4 7l1.2 1.2L7.5 5.9l1.4 1.4L5.2 11 2.6 8.4 4 7Zm0 10 1.2 1.2 2.3-2.3 1.4 1.4L5.2 21 2.6 18.4 4 17Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'phone':
      return (
        <svg {...common} {...props}>
          <path
            d="M6.6 10.8c1.4 2.7 3.9 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.4.6 3.7.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.3 21 3 13.7 3 4c0-.6.4-1 1-1h3.9c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.7.1.4 0 .8-.3 1.1l-2.2 2.2Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'mail':
      return (
        <svg {...common} {...props}>
          <path
            d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'bot':
      return (
        <svg {...common} {...props}>
          <path
            d="M12 2a1 1 0 0 1 1 1v1h3a3 3 0 0 1 3 3v9a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V7a3 3 0 0 1 3-3h3V3a1 1 0 0 1 1-1Zm-4 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-8 7h8v2H8v-2Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common} {...props}>
          <path
            d="M19.4 13a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2.1-1.6a.5.5 0 0 0 .1-.6l-2-3.5a.5.5 0 0 0-.6-.2l-2.5 1a7.6 7.6 0 0 0-1.7-1L14.5 2.5a.5.5 0 0 0-.5-.4h-4a.5.5 0 0 0-.5.4L9 4.5a7.6 7.6 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.5a.5.5 0 0 0 .1.6L4.6 11a7.9 7.9 0 0 0-.1 1c0 .3 0 .7.1 1L2.5 14.6a.5.5 0 0 0-.1.6l2 3.5c.1.2.4.3.6.2l2.5-1c.5.4 1.1.7 1.7 1l.5 2.1c.1.2.3.4.5.4h4c.2 0 .4-.2.5-.4l.5-2.1c.6-.3 1.2-.6 1.7-1l2.5 1c.2.1.5 0 .6-.2l2-3.5a.5.5 0 0 0-.1-.6L19.4 13ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common} {...props}>
          <path d="M11 5h2v14h-2z" fill="currentColor" />
          <path d="M5 11h14v2H5z" fill="currentColor" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common} {...props}>
          <path
            d="M10 18a8 8 0 1 1 5.3-14 8 8 0 0 1-5.3 14Zm11 3-5.2-5.2 1.4-1.4L22.4 19.6 21 21Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'chevronDown':
      return (
        <svg {...common} {...props}>
          <path
            d="M6.7 9.3a1 1 0 0 1 1.4 0L12 13.2l3.9-3.9a1 1 0 1 1 1.4 1.4l-4.6 4.6a1 1 0 0 1-1.4 0L6.7 10.7a1 1 0 0 1 0-1.4Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'check':
      return (
        <svg {...common} {...props}>
          <path
            d="M9.2 16.6 4.9 12.3l1.4-1.4 2.9 2.9 8.5-8.5 1.4 1.4-9.9 9.9Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common} {...props}>
          <path
            d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm1-17h-2v7l6 3 1-1.7-5-2.3V5Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'spark':
      return (
        <svg {...common} {...props}>
          <path
            d="M12 2l1.2 4.2L17.4 8l-4.2 1.2L12 13.4l-1.2-4.2L6.6 8l4.2-1.8L12 2Zm7 9 0.7 2.3L22 14l-2.3.7L19 17l-.7-2.3L16 14l2.3-.7L19 11ZM4 11l.9 3.1L8 15l-3.1.9L4 19l-.9-3.1L0 15l3.1-.9L4 11Z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      return null;
  }
}
