import React from 'react';
import { Box, BoxProps } from '@mui/material';

export type StreamlineIconName =
    | 'hand-wave'
    | 'globe'
    | 'megaphone'
    | 'chef-hat'
    | 'music-note'
    | 'bell'
    | 'clipboard-check'
    | 'camera'
    | 'clock'
    | 'dress'
    | 'banknote'
    | 'lotus'
    | 'gift'
    | 'check-circle'
    | 'flower'
    | 'sunflower'
    | 'trumpet'
    | 'bouquet'
    | 'party-popper'
    | 'microphone'
    | 'sparkles'
    | 'beach'
    | 'horse'
    | 'map-pin'
    | 'palm-tree'
    | 'buildings'
    | 'map-route'
    | 'sun-cloud'
    | 'whatsapp'
    | 'users'
    | 'calendar-remove'
    | 'plane-takeoff'
    | 'calendar-check'
    | 'calendar'
    | 'plane'
    | 'store';

interface StreamlineIconProps extends BoxProps {
    name: StreamlineIconName;
    size?: number | string;
    color?: string;
}

const ICON_PATHS: Record<StreamlineIconName, React.ReactNode> = {
    'hand-wave': (
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2V7h2v10z" />
    ),
    'globe': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M3.6 9h16.8M3.6 15h16.8" />
            <path d="M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
        </g>
    ),
    'megaphone': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5v14l11-7zM2 9v6h7l11 7V2L9 9H2z" />
        </g>
    ),
    'chef-hat': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 18h12v-2a6 6 0 1 0-12 0v2z" />
            <path d="M6 14a3 3 0 1 1 0-6 3 3 0 1 1 6 0 3 3 0 1 1 6 0 3 3 0 1 1 0 6" />
        </g>
    ),
    'music-note': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
        </g>
    ),
    'bell': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </g>
    ),
    'clipboard-check': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="m9 14 2 2 4-4" />
        </g>
    ),
    'camera': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </g>
    ),
    'clock': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
        </g>
    ),
    'dress': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3h8l2 5-2 13H6L4 8l4-5z" />
            <path d="M8 8s2 2 4 2 4-2 4-2" />
        </g>
    ),
    'banknote': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="3" />
            <path d="M6 12h.01M18 12h.01" />
        </g>
    ),
    'lotus': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s-8-4-8-10S8 2 12 2s8 4 8 10-8 10-8 10z" />
            <path d="M12 22c4 0 8-4 8-10S16 2 12 2" />
            <path d="M12 22c-4 0-8-4-8-10S8 2 12 2" />
        </g>
    ),
    'gift': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12v10H4V12" />
            <path d="M2 7h20v5H2z" />
            <path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </g>
    ),
    'check-circle': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="m9 12 2 2 4-4" />
        </g>
    ),
    'flower': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 9V3M12 21v-6M9 12H3M21 12h-6m-3-3l-4-4m8 8l4 4m-8-4l4-4m-8 8l-4 4" />
        </g>
    ),
    'sunflower': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 8V2M12 22v-6M8 12H2M22 12h-6m-4-4l-4-4m8 8l4 4m-8-4l4-4m-8 8l-4 4m2-8l-2-2m12 12l2 2m-2-12l2-2m-12 12l-2 2" />
        </g>
    ),
    'trumpet': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 13h16l4 4V9l-4 4H2z" />
            <path d="M6 13V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
            <path d="M9 7V4M11 7V4M13 7V4" />
        </g>
    ),
    'bouquet': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22v-8M8 22l4-8M16 22l-4-8" />
            <circle cx="12" cy="9" r="3" />
            <circle cx="8" cy="11" r="3" />
            <circle cx="16" cy="11" r="3" />
            <circle cx="9" cy="6" r="3" />
            <circle cx="15" cy="6" r="3" />
        </g>
    ),
    'party-popper': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20l10-10M10 4l1 1M14 8l1 1M6 12l1 1M13 3l.5 1.5M18 6l-1.5 1.5M3 13l1.5.5M6 18l.5 1.5" />
            <path d="M19 3v4M21 5h-4" />
        </g>
    ),
    'microphone': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0M12 17v3M8 21h8" />
        </g>
    ),
    'sparkles': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3 1.5 4.5 4.5 1.5-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM20 12l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5zM4 14l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5z" />
        </g>
    ),
    'beach': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19s-2-2-5-2-5 2-5 2-2-2-5-2-5 2-5 2v3h20v-3z" />
            <path d="M16 11V3l4 1-4 2" />
            <circle cx="7" cy="7" r="3" />
        </g>
    ),
    'horse': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 20c1-3 4-4 4-4M7 16l3-10h4l4 2 2 8-5 2-4-2H7z" />
            <path d="M10 6L9 4M14 6l1-2" />
        </g>
    ),
    'map-pin': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </g>
    ),
    'palm-tree': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 22s-2-7-2-12" />
            <path d="M11 10c-3 0-6-3-6-3M11 10c-2-2-2-5-2-5M11 10c1-3 4-4 4-4M11 10c3-1 6 1 6 1M11 10c2 2 3 5 3 5" />
        </g>
    ),
    'buildings': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 22h20M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
            <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
        </g>
    ),
    'map-route': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 20l-5-3V4l5 3 6-3 5 3v13l-5-3-6 3zM9 7v13M15 4v13" />
        </g>
    ),
    'sun-cloud': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10" />
            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </g>
    ),
    'whatsapp': (
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516" />
    ),
    'users': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </g>
    ),
    'calendar-remove': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="M10 14l4 4M14 14l-4 4" />
        </g>
    ),
    'plane-takeoff': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 22h20" />
            <path d="M8 7.6 10.3 9.9 16.7 8.6 22.1 14 14.1 16.3 11.5 20.3 8 18.8 9.5 12.3 8 7.6z" />
        </g>
    ),
    'calendar-check': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="m9 16 2 2 4-4" />
        </g>
    ),
    'calendar': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </g>
    ),
    'plane': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h20" />
            <path d="M13 2 9 12l4 10 3-10-3-10z" />
        </g>
    ),
    'store': (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
            <path d="M2 7h20" />
            <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
        </g>
    ),
};

/**
 * A consistent wrapper for Streamline icons (Line/Black style).
 */
export default function StreamlineIcon({
    name,
    size = 24,
    color = 'currentColor',
    sx,
    ...props
}: StreamlineIconProps) {
    const path = ICON_PATHS[name] || ICON_PATHS['globe'];

    return (
        <Box
            component="svg"
            viewBox="0 0 24 24"
            sx={{
                width: size,
                height: size,
                color: color,
                display: 'inline-block',
                verticalAlign: 'middle',
                flexShrink: 0,
                ...sx
            }}
            {...props}
        >
            {path}
        </Box>
    );
}
