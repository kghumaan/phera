'use client'

import { useState } from 'react'
import { Box, Chip, FormControl, Grid, InputLabel, MenuItem, OutlinedInput, Select, SelectChangeEvent, Stack, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import Link from 'next/link'
import AppHeader from '@/components/shared/AppHeader'
import HomeNavLinks from '@/components/landing/HomeNavLinks'
import { PheraCard } from '@/components/shared/Card'
import { PheraTextField } from '@/components/shared/TextField'
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton'
import { COLORS, RADII, FONTS } from '@/lib/theme/tokens'
import { VENDOR_CATEGORY_LABELS, VENDOR_CITY_CONFIG, VendorCategory } from '@/lib/vendors/directory/types'

type FormState = {
  business_name: string
  contact_name: string
  email: string
  phone: string
  website: string
  instagram_handle: string
  logo_url: string
  category: VendorCategory | ''
  cities: string[]
  price_range_min: string
  price_range_max: string
  bio: string
}

const EMPTY: FormState = {
  business_name: '',
  contact_name: '',
  email: '',
  phone: '',
  website: '',
  instagram_handle: '',
  logo_url: '',
  category: '',
  cities: [],
  price_range_min: '',
  price_range_max: '',
  bio: '',
}

const PERKS = [
  'Get discovered by NRI couples planning destination weddings',
  'Featured across 9 cities including Goa, Bali, Dubai, and Jodhpur',
  'Free listing — no commission, no monthly fee',
  'Verified badge once our team reviews your portfolio',
]

export default function VendorJoinClient() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleCitiesChange = (e: SelectChangeEvent<string[]>) => {
    const val = e.target.value
    setForm(f => ({ ...f, cities: typeof val === 'string' ? val.split(',') : val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.business_name || !form.email || !form.category || !form.cities.length) return

    setStatus('submitting')
    try {
      const res = await fetch('/api/vendors/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price_range_min: form.price_range_min ? parseInt(form.price_range_min) : null,
          price_range_max: form.price_range_max ? parseInt(form.price_range_max) : null,
          instagram_handle: form.instagram_handle.replace(/^@/, ''),
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Something went wrong')
      }
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: COLORS.bg.paper }}>
        <AppHeader variant="solid" rightSlot={<HomeNavLinks />} />
        <Box sx={{ maxWidth: 520, mx: 'auto', px: 3, py: 12, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 56, color: COLORS.brand.primary, mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, fontFamily: FONTS.body }}>
            You&apos;re listed!
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.text.muted, mb: 4, lineHeight: 1.6 }}>
            Your listing is now live on Phera. Couples can discover you right away. We&apos;ll follow up at{' '}
            <strong>{form.email}</strong> to help you get verified.
          </Typography>
          <SecondaryActionButton component={Link} href="/">
            Back to Phera
          </SecondaryActionButton>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.bg.paper }}>
      <AppHeader variant="solid" rightSlot={<HomeNavLinks />} />

      <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 6, md: 10 } }}>
        <Grid container spacing={6} alignItems="flex-start">

          {/* Left — value prop */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: 100 } }}>
              <Typography
                variant="caption"
                sx={{
                  color: COLORS.brand.primary,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  display: 'block',
                  mb: 1,
                }}
              >
                For vendors
              </Typography>
              <Typography
                sx={{
                  fontFamily: FONTS.display,
                  fontSize: { xs: '1.8rem', md: '2.2rem' },
                  fontStyle: 'italic',
                  lineHeight: 1.15,
                  mb: 2,
                  color: COLORS.text.strong,
                }}
              >
                List your business.
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.7, mb: 3 }}>
                Phera connects couples planning destination weddings with trusted vendors across India and abroad. Get in front of couples with $200K+ budgets, before they even know your name.
              </Typography>
              <Stack spacing={1.5}>
                {PERKS.map((p) => (
                  <Stack key={p} direction="row" spacing={1.25} alignItems="center">
                    <CheckCircleIcon sx={{ fontSize: 17, color: COLORS.brand.primary, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.5 }}>
                      {p}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Right — form */}
          <Grid size={{ xs: 12, md: 8 }}>
            <PheraCard sx={{ p: { xs: 2.5, md: 4 } }}>
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>

                  {/* Business info */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: COLORS.text.strong }}>
                      Business info
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12 }}>
                        <PheraTextField
                          label="Business name"
                          value={form.business_name}
                          onChange={set('business_name')}
                          required
                          fullWidth
                          placeholder="e.g. Rishi Photography"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <PheraTextField
                          select
                          label="Category"
                          value={form.category}
                          onChange={set('category')}
                          required
                          fullWidth
                        >
                          {Object.entries(VENDOR_CATEGORY_LABELS).map(([v, l]) => (
                            <MenuItem key={v} value={v}>{l}</MenuItem>
                          ))}
                        </PheraTextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth required>
                          <InputLabel
                            sx={{
                              color: COLORS.text.muted,
                              fontWeight: 500,
                              '&.Mui-focused': { color: COLORS.brand.primary },
                            }}
                          >
                            Cities you serve
                          </InputLabel>
                          <Select
                            multiple
                            value={form.cities}
                            onChange={handleCitiesChange}
                            input={
                              <OutlinedInput
                                label="Cities you serve"
                                sx={{
                                  bgcolor: 'white',
                                  borderRadius: `${RADII.md}px`,
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(0,0,0,0.23)',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: COLORS.text.strong,
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: COLORS.brand.primary,
                                  },
                                  color: COLORS.text.strong,
                                }}
                              />
                            }
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {(selected as string[]).map((v) => (
                                  <Chip
                                    key={v}
                                    label={v}
                                    size="small"
                                    sx={{
                                      bgcolor: COLORS.brand.primary,
                                      color: COLORS.text.inverse,
                                      fontWeight: 500,
                                      fontSize: '0.875rem',
                                      height: 26,
                                    }}
                                  />
                                ))}
                              </Box>
                            )}
                          >
                            {VENDOR_CITY_CONFIG.map((c) => (
                              <MenuItem key={c.city} value={c.city}>
                                {c.city}, {c.country}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <PheraTextField
                          label="Bio / what makes you special"
                          value={form.bio}
                          onChange={set('bio')}
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="Tell couples what you do and why they should pick you..."
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <PheraTextField
                          label="Logo or portfolio image URL (optional)"
                          value={form.logo_url}
                          onChange={set('logo_url')}
                          fullWidth
                          placeholder="https://yoursite.com/logo.jpg"
                          type="url"
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Pricing */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: COLORS.text.strong }}>
                      Pricing (USD, optional)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <PheraTextField
                          label="Starting from ($)"
                          value={form.price_range_min}
                          onChange={set('price_range_min')}
                          fullWidth
                          type="number"
                          placeholder="e.g. 2000"
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <PheraTextField
                          label="Up to ($)"
                          value={form.price_range_max}
                          onChange={set('price_range_max')}
                          fullWidth
                          type="number"
                          placeholder="e.g. 8000"
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Links */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: COLORS.text.strong }}>
                      Links
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <PheraTextField
                          label="Website"
                          value={form.website}
                          onChange={set('website')}
                          fullWidth
                          placeholder="https://yoursite.com"
                          type="url"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <PheraTextField
                          label="Instagram handle"
                          value={form.instagram_handle}
                          onChange={set('instagram_handle')}
                          fullWidth
                          placeholder="@yourhandle"
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Contact */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: COLORS.text.strong }}>
                      Contact details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <PheraTextField
                          label="Your name"
                          value={form.contact_name}
                          onChange={set('contact_name')}
                          required
                          fullWidth
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <PheraTextField
                          label="Email"
                          value={form.email}
                          onChange={set('email')}
                          required
                          fullWidth
                          type="email"
                          placeholder="you@studio.com"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <PheraTextField
                          label="Phone (optional)"
                          value={form.phone}
                          onChange={set('phone')}
                          fullWidth
                          type="tel"
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {status === 'error' && (
                    <Typography variant="body2" sx={{ color: COLORS.accent.danger }}>
                      {errorMsg}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                    <PrimaryActionButton
                      type="submit"
                      loading={status === 'submitting'}
                    >
                      Submit listing
                    </PrimaryActionButton>
                  </Box>

                  <Typography variant="caption" sx={{ color: COLORS.text.faint, textAlign: 'center' }}>
                    Free forever. Listings go live immediately — verification badge added after review.
                  </Typography>

                </Stack>
              </Box>
            </PheraCard>
          </Grid>

        </Grid>
      </Box>
    </Box>
  )
}
