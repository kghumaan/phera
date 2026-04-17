'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaletteIcon from '@mui/icons-material/Palette';
import InfoIcon from '@mui/icons-material/Info';
import { animationPresets, culturalColors } from '@/lib/animations/cultural';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface CulturalEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  emoji: string;
  color: string;
  description: string;
  significance: string;
  dressCode: {
    title: string;
    description: string;
    colors: string[];
    examples: string[];
  };
  rituals: string[];
  participation: {
    title: string;
    tips: string[];
  };
  gifts?: {
    title: string;
    suggestions: string[];
  };
}

const ceremoniesData: CulturalEvent[] = [
  {
    id: 'mehendi',
    name: 'Mehendi Ceremony',
    date: 'February 20, 2024',
    time: '4:00 PM - 8:00 PM',
    location: 'Garden Venue, Delhi',
    emoji: '🎨',
    color: culturalColors.saffron,
    description: 'A joyous celebration where intricate henna designs are applied to the bride\'s hands and feet, symbolizing joy, beauty, and spiritual awakening.',
    significance: 'Mehendi represents the bond of matrimony and is believed to bring good luck and ward off evil spirits. The darker the henna stain, the stronger the love between the couple.',
    dressCode: {
      title: 'Vibrant & Comfortable',
      description: 'Wear bright, colorful traditional outfits that you don\'t mind getting henna on.',
      colors: ['Yellow', 'Orange', 'Green', 'Pink', 'Red'],
      examples: ['Kurti with leggings', 'Anarkali suit', 'Sharara set', 'Palazzo with dupatta']
    },
    rituals: [
      'Professional henna artists apply intricate designs',
      'Music and dancing while henna dries',
      'Traditional songs and games',
      'Photo sessions with henna designs'
    ],
    participation: {
      title: 'How to Participate',
      tips: [
        'Get henna applied on your hands (it\'s complimentary!)',
        'Join in the traditional songs and dances',
        'Help with games and ceremonies',
        'Take lots of photos with the beautiful decorations'
      ]
    },
    gifts: {
      title: 'Gift Suggestions',
      suggestions: ['Jewelry', 'Silk scarves', 'Traditional sweets', 'Decorative items']
    }
  },
  {
    id: 'sangeet',
    name: 'Sangeet Night',
    date: 'February 21, 2024',
    time: '7:00 PM - 12:00 AM',
    location: 'Grand Ballroom, Hotel Taj',
    emoji: '🎵',
    color: culturalColors.gold,
    description: 'A musical evening filled with dance performances, songs, and celebration. Families showcase choreographed dances and compete in friendly competitions.',
    significance: 'Sangeet means "sung together" and represents the union of two families through music and dance. It\'s a time for both families to bond and celebrate.',
    dressCode: {
      title: 'Glamorous & Dance-Friendly',
      description: 'Dress to impress but ensure you can dance comfortably all night!',
      colors: ['Gold', 'Maroon', 'Royal Blue', 'Emerald', 'Purple'],
      examples: ['Lehenga choli', 'Saree with blouse', 'Indo-western outfit', 'Sherwani for men']
    },
    rituals: [
      'Family dance performances',
      'Musical competitions between families',
      'DJ and live music',
      'Dance floor open to all guests'
    ],
    participation: {
      title: 'How to Participate',
      tips: [
        'Join the dance floor - no experience needed!',
        'Cheer for the family performances',
        'Request your favorite Bollywood songs',
        'Participate in dance competitions and games'
      ]
    }
  },
  {
    id: 'haldi',
    name: 'Haldi Ceremony',
    date: 'February 22, 2024',
    time: '10:00 AM - 12:00 PM',
    location: 'Bride\'s Family Home',
    emoji: '✨',
    color: '#FFC107',
    description: 'A purification ritual where turmeric paste is applied to the bride and groom for a natural glow and to ward off evil spirits before the wedding.',
    significance: 'Haldi (turmeric) has antiseptic properties and is believed to bring good luck, purify the soul, and give a natural glow to the couple.',
    dressCode: {
      title: 'Bright Yellow & Washable',
      description: 'Wear clothes you don\'t mind getting turmeric stains on - it\'s part of the fun!',
      colors: ['Yellow', 'Orange', 'White (will turn yellow!)'],
      examples: ['Old kurta', 'Cotton outfit', 'Simple traditional wear']
    },
    rituals: [
      'Turmeric paste application ceremony',
      'Blessings from family elders',
      'Traditional songs and celebrations',
      'Oil massage and beauty treatments'
    ],
    participation: {
      title: 'How to Participate',
      tips: [
        'Apply haldi on the couple (be gentle!)',
        'Join in the traditional songs',
        'Take lots of colorful photos',
        'Enjoy the festive atmosphere'
      ]
    }
  },
  {
    id: 'wedding',
    name: 'Wedding Ceremony',
    date: 'February 22, 2024',
    time: '6:00 PM - 10:00 PM',
    location: 'Sacred Heart Temple, Delhi',
    emoji: '💍',
    color: culturalColors.maroon,
    description: 'The sacred Hindu wedding ceremony with traditional rituals, fire blessings, and the exchange of vows in the presence of family, friends, and divine witnesses.',
    significance: 'The most sacred part of the celebration, where the couple takes seven vows (Saat Phere) around the holy fire, promising to support each other in all aspects of life.',
    dressCode: {
      title: 'Traditional & Elegant',
      description: 'This is the most formal ceremony - dress in your finest traditional attire.',
      colors: ['Red', 'Maroon', 'Gold', 'Pink', 'Orange'],
      examples: ['Heavy lehenga/saree', 'Silk outfit with jewelry', 'Formal sherwani with turban']
    },
    rituals: [
      'Baraat (groom\'s procession)',
      'Jaimala (exchange of garlands)',
      'Kanyadaan (giving away of the bride)',
      'Saat Phere (seven sacred vows)',
      'Sindoor and Mangalsutra ceremony'
    ],
    participation: {
      title: 'How to Participate',
      tips: [
        'Throw flower petals during ceremonies',
        'Join the Baraat procession',
        'Offer blessings to the couple',
        'Maintain respectful silence during sacred moments',
        'Participate in traditional rituals when invited'
      ]
    }
  },
  {
    id: 'reception',
    name: 'Reception',
    date: 'February 23, 2024',
    time: '7:00 PM - 12:00 AM',
    location: 'The Grand Palace, Delhi',
    emoji: '🎉',
    color: culturalColors.coral,
    description: 'A grand celebration dinner where the newlywed couple is formally introduced as husband and wife to the extended community and friends.',
    significance: 'The reception is a time for the larger community to bless the couple and celebrate their union with dining, dancing, and merrymaking.',
    dressCode: {
      title: 'Cocktail & Contemporary',
      description: 'Semi-formal to formal attire. You can mix traditional with contemporary styles.',
      colors: ['Any elegant colors', 'Pastels', 'Jewel tones'],
      examples: ['Cocktail saree', 'Indo-western dress', 'Elegant suit', 'Designer lehenga']
    },
    rituals: [
      'Couple\'s grand entrance',
      'Cake cutting ceremony',
      'First dance as married couple',
      'Speeches and toasts',
      'Dinner and entertainment'
    ],
    participation: {
      title: 'How to Participate',
      tips: [
        'Enjoy the multi-cuisine dinner',
        'Give speeches or toasts (if invited)',
        'Dance and celebrate with the couple',
        'Take lots of photos with the newlyweds',
        'Participate in games and entertainment'
      ]
    }
  }
];

export default function CulturalGuide() {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('dressCode');

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepClick = (stepIndex: number) => {
    setActiveStep(stepIndex);
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const currentCeremony = ceremoniesData[activeStep];

  return (
    <motion.div
      variants={animationPresets.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={animationPresets.fadeInUp}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 600,
              mb: 2,
              background: `linear-gradient(45deg, ${culturalColors.maroon}, ${culturalColors.gold})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            Wedding Ceremony Guide
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Learn about the beautiful traditions and rituals of our Indian wedding celebration
          </Typography>
        </Box>
      </motion.div>

      {/* Timeline Stepper */}
      <motion.div variants={animationPresets.fadeInUp}>
        <Card elevation={0} sx={{ mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Stepper activeStep={activeStep} orientation="vertical" sx={{ p: 3 }}>
              {ceremoniesData.map((ceremony, index) => (
                <Step key={ceremony.id}>
                  <StepLabel
                    onClick={() => handleStepClick(index)}
                    sx={{ cursor: 'pointer' }}
                    StepIconComponent={() => (
                      <Avatar
                        sx={{
                          bgcolor: index === activeStep ? ceremony.color : 'grey.300',
                          color: COLORS.text.inverse,
                          width: 40,
                          height: 40,
                          fontSize: '1.2rem',
                        }}
                      >
                        {ceremony.emoji}
                      </Avatar>
                    )}
                  >
                    <Box>
                      <Typography variant="h6" component="div">
                        {ceremony.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {ceremony.date} • {ceremony.time}
                      </Typography>
                    </Box>
                  </StepLabel>
                  {index === activeStep && (
                    <StepContent>
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label="Currently Viewing"
                          color="primary"
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      </Box>
                    </StepContent>
                  )}
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ceremony Details */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          variants={animationPresets.fadeInUp}
          initial="hidden"
          animate="visible"
          exit="out"
        >
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${currentCeremony.color}20 0%, ${currentCeremony.color}10 100%)`,
                p: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: currentCeremony.color,
                    color: COLORS.text.inverse,
                    mr: 2,
                    width: 56,
                    height: 56,
                    fontSize: '1.5rem',
                  }}
                >
                  {currentCeremony.emoji}
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {currentCeremony.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip icon={<EventIcon />} label={currentCeremony.date} />
                    <Chip icon={<AccessTimeIcon />} label={currentCeremony.time} />
                    <Chip icon={<LocationOnIcon />} label={currentCeremony.location} />
                  </Box>
                </Box>
              </Box>
              
              <Typography variant="body2" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                {currentCeremony.description}
              </Typography>
            </Box>

            {/* Content Accordions */}
            <CardContent sx={{ p: 0 }}>
              {/* Significance */}
              <Accordion
                expanded={expandedAccordion === 'significance'}
                onChange={handleAccordionChange('significance')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon sx={{ mr: 2, color: currentCeremony.color }} />
                    <Typography variant="h6">Cultural Significance</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                    {currentCeremony.significance}
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {/* Dress Code */}
              <Accordion
                expanded={expandedAccordion === 'dressCode'}
                onChange={handleAccordionChange('dressCode')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PaletteIcon sx={{ mr: 2, color: currentCeremony.color }} />
                    <Typography variant="h6">Dress Code</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="h6" gutterBottom>
                    {currentCeremony.dressCode.title}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {currentCeremony.dressCode.description}
                  </Typography>
                  
                  <Typography variant="subtitleCaps" gutterBottom>
                    Recommended Colors:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {currentCeremony.dressCode.colors.map((color) => (
                      <Chip key={color} label={color} variant="outlined" />
                    ))}
                  </Box>

                  <Typography variant="subtitleCaps" gutterBottom>
                    Outfit Examples:
                  </Typography>
                  <List dense>
                    {currentCeremony.dressCode.examples.map((example) => (
                      <ListItem key={example}>
                        <ListItemText primary={example} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>

              {/* Rituals */}
              <Accordion
                expanded={expandedAccordion === 'rituals'}
                onChange={handleAccordionChange('rituals')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EventIcon sx={{ mr: 2, color: currentCeremony.color }} />
                    <Typography variant="h6">Ceremony Rituals</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {currentCeremony.rituals.map((ritual, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              bgcolor: currentCeremony.color + '20',
                              color: currentCeremony.color,
                              width: 32,
                              height: 32,
                              fontSize: '0.8rem',
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText primary={ritual} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>

              {/* Participation */}
              <Accordion
                expanded={expandedAccordion === 'participation'}
                onChange={handleAccordionChange('participation')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ color: currentCeremony.color, mr: 2 }}>
                      🤝
                    </Typography>
                    <Typography variant="h6">{currentCeremony.participation.title}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {currentCeremony.participation.tips.map((tip, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Typography variant="body1" sx={{ color: currentCeremony.color, fontSize: '1.2rem' }}>
                            ✨
                          </Typography>
                        </ListItemIcon>
                        <ListItemText primary={tip} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>

              {/* Gifts (if available) */}
              {currentCeremony.gifts && (
                <Accordion
                  expanded={expandedAccordion === 'gifts'}
                  onChange={handleAccordionChange('gifts')}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ color: currentCeremony.color, mr: 2 }}>
                        🎁
                      </Typography>
                      <Typography variant="h6">{currentCeremony.gifts.title}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {currentCeremony.gifts.suggestions.map((gift, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Typography variant="body1" sx={{ color: currentCeremony.color, fontSize: '1.2rem' }}>
                              💝
                            </Typography>
                          </ListItemIcon>
                          <ListItemText primary={gift} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}
            </CardContent>

            {/* Navigation */}
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
                sx={{ borderRadius: 3 }}
              >
                Previous Ceremony
              </Button>
              <Button
                disabled={activeStep === ceremoniesData.length - 1}
                onClick={handleNext}
                variant="contained"
                sx={{ borderRadius: 3 }}
              >
                Next Ceremony
              </Button>
            </Box>
          </Card>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
} 