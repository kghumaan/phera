'use client';

import { Box, Container, Grid, Typography, Stack, alpha, IconButton } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Email, WhatsApp } from '@mui/icons-material';
import { COLORS, RADII } from '@/lib/theme/tokens';

export default function AppFooter() {
    return (
        <Box sx={{ bgcolor: COLORS.bg.subtle, color: COLORS.text.strong, py: 8, mt: 'auto' }}>
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 4 } as any}>
                        <Image
                            src="/logo.svg"
                            alt="Phera Logo"
                            width={120}
                            height={32}
                            style={{
                                height: '32px',
                                width: 'auto',
                                marginBottom: '16px',
                                filter: 'brightness(0)',
                            }}
                        />
                        <Typography variant="body2" sx={{ mb: 2, color: COLORS.text.muted }}>
                            Phera was built by a couple frustrated with the complexity of
                            planning a modern Indian destination wedding. We knew there had
                            to be a better way—so we built it.
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                            Making Indian weddings beautiful to plan, not just beautiful to
                            attend.
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 } as any}>
                        <Typography
                            variant="subtitleCaps"
                            sx={{ color: COLORS.text.strong, fontWeight: 'bold', mb: 2 }}
                        >
                            Platform
                        </Typography>
                        <Stack spacing={1}>
                            <Link href="/features" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                                Features
                            </Link>
                            <Link href="/#pricing" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                                Pricing
                            </Link>
                            <Link href="/demo" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                                Demo
                            </Link>
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 } as any}>
                        <Typography
                            variant="subtitleCaps"
                            sx={{ color: COLORS.text.strong, fontWeight: 'bold', mb: 2 }}
                        >
                            Company
                        </Typography>
                        <Stack spacing={1}>
                            <Link href="/about" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                                About Us
                            </Link>
                            <Link href="/blog" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                                Blog
                            </Link>
                            <Link href="/contact" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                                Contact
                            </Link>
                            <Link href="/privacy" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                                Privacy
                            </Link>
                            <Link href="/terms" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                                Terms
                            </Link>
                            <Link href="/legal/sub-processors" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                                Sub-Processors
                            </Link>
                            <Link href="/legal/dpa" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                                Data Processing Addendum
                            </Link>
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 } as any}>
                        <Typography
                            variant="subtitleCaps"
                            sx={{ color: COLORS.text.strong, fontWeight: 'bold', mb: 2 }}
                        >
                            Connect
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <IconButton
                                component="a"
                                href="https://instagram.com/withphera"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: COLORS.brand.primary, bgcolor: alpha(COLORS.brand.primary, 0.1), '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.2) } }}
                            >
                                <Instagram />
                            </IconButton>
                            <IconButton
                                component="a"
                                href="mailto:contact@phera.io"
                                sx={{ color: COLORS.brand.primary, bgcolor: alpha(COLORS.brand.primary, 0.1), '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.2) } }}
                            >
                                <Email />
                            </IconButton>
                            <IconButton
                                component="a"
                                href="https://wa.me/15558397813"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: COLORS.brand.primary, bgcolor: alpha(COLORS.brand.primary, 0.1), '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.2) } }}
                            >
                                <WhatsApp />
                            </IconButton>
                        </Stack>
                    </Grid>
                </Grid>
                <Box
                    sx={{
                        borderTop: '1px solid rgba(0,0,0,0.1)',
                        mt: 8,
                        pt: 4,
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="body2" sx={{ color: COLORS.text.muted, fontWeight: 500 }}>
                        © 2026 Phera Events. All rights reserved.
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.text.faint, display: 'block', mt: 0.5 }}>
                        Phera Events is owned and operated by Ghumaan Ventures, LLC.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
