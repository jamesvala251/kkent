import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Link,
  Paper,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ConstructionIcon from '@mui/icons-material/Construction';
import RouteIcon from '@mui/icons-material/Route';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BadgeIcon from '@mui/icons-material/Badge';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import CompanyLogo from '../../components/common/CompanyLogo';
import { useAppSelector } from '../../hooks/redux';
import './landing.css';

const CONTACT = {
  phones: [
    { number: '9924427936', display: 'Mo. 9924427936' },
    { number: '9924431627', display: 'Mo. 9924431627' },
  ],
  gstin: '24BQCPV9444A1ZU',
  address: '1, Vadi Vistar, At. Mota Ashota, Ta. Kalyanpur, Dist. Devbhoomi Dwarka, Gujarat, 361305',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=1+Vadi+Vistar+Mota+Ashota+Kalyanpur+Devbhoomi+Dwarka+Gujarat+361305',
};

function PhoneLinks({ centered = false }: { centered?: boolean }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, alignItems: centered ? 'center' : 'flex-start' }}>
      {CONTACT.phones.map((phone) => (
        <Link key={phone.number} href={`tel:${phone.number}`} underline="hover" fontWeight={600}>
          {phone.display}
        </Link>
      ))}
    </Box>
  );
}

const services = [
  {
    icon: <LocalShippingIcon sx={{ fontSize: 40 }} />,
    title: 'Transport & Logistics',
    desc: 'Reliable truck transport for bulk materials, construction supplies and industrial cargo across Gujarat.',
    color: '#1a237e',
  },
  {
    icon: <ConstructionIcon sx={{ fontSize: 40 }} />,
    title: 'Hitachi & Excavator Rental',
    desc: 'Hourly, daily and monthly rental of excavators for construction, mining and infrastructure projects.',
    color: '#ed6c02',
  },
  {
    icon: <RouteIcon sx={{ fontSize: 40 }} />,
    title: 'Fleet Operations',
    desc: 'End-to-end trip management, diesel tracking, driver coordination and on-time delivery.',
    color: '#1565c0',
  },
  {
    icon: <ReceiptLongIcon sx={{ fontSize: 40 }} />,
    title: 'Billing & Compliance',
    desc: 'GST-compliant invoicing, transparent freight rates and professional documentation.',
    color: '#2e7d32',
  },
];

const stats = [
  { value: 15, suffix: '+', label: 'Years Experience' },
  { value: 50, suffix: '+', label: 'Fleet Vehicles' },
  { value: 1000, suffix: '+', label: 'Trips Completed' },
  { value: 100, suffix: '%', label: 'Client Focus' },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function RevealSection({ children, sx }: { children: React.ReactNode; sx?: object }) {
  const { ref, visible } = useReveal();
  return (
    <Box ref={ref} className={`landing-reveal${visible ? ' visible' : ''}`} sx={sx}>
      {children}
    </Box>
  );
}

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const { ref, visible } = useReveal();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [visible, target]);

  return (
    <Box ref={ref}>
      <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
        {count}{suffix}
      </Typography>
    </Box>
  );
}

export default function LandingPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [navOpen, setNavOpen] = useState(false);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const scrollTo = (id: string) => {
    setNavOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Services', id: 'services' },
    { label: 'About', id: 'about' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <Box sx={{ bgcolor: '#f4f6fb', overflow: 'hidden' }}>
      {/* Navbar */}
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          bgcolor: '#ffffff',
          borderBottom: '1px solid rgba(26,35,126,0.08)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', gap: 2, minHeight: { xs: 146, md: 154 }, py: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CompanyLogo size="hero" />
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {navLinks.map((l) => (
                <Button key={l.id} color="inherit" onClick={() => scrollTo(l.id)} sx={{ color: 'text.primary', fontWeight: 500 }}>
                  {l.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              component="a"
              href={`tel:${CONTACT.phones[0].number}`}
              variant="outlined"
              size="small"
              startIcon={<PhoneIcon />}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Call Us
            </Button>
            <Button
              component={RouterLink}
              to={isAuthenticated ? '/dashboard' : '/auth/login'}
              variant="contained"
              endIcon={<ArrowForwardIcon />}
            >
              {isAuthenticated ? 'Dashboard' : 'ERP Login'}
            </Button>
            {isMobile && (
              <IconButton onClick={() => setNavOpen(!navOpen)} color="primary">
                {navOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            )}
          </Box>
        </Toolbar>

        {isMobile && navOpen && (
          <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {navLinks.map((l) => (
              <Button key={l.id} fullWidth onClick={() => scrollTo(l.id)}>
                {l.label}
              </Button>
            ))}
          </Box>
        )}
      </AppBar>

      {/* Hero */}
      <Box className="landing-hero-bg" sx={{ position: 'relative', pt: { xs: 22, md: 26 }, pb: { xs: 10, md: 14 }, minHeight: { md: '92vh' }, display: 'flex', alignItems: 'center' }}>
        {/* Floating decorations */}
        <Box className="landing-float" sx={{ position: 'absolute', top: '18%', left: '6%', opacity: 0.12, color: 'white' }}>
          <LocalShippingIcon sx={{ fontSize: 120 }} />
        </Box>
        <Box className="landing-float-reverse" sx={{ position: 'absolute', bottom: '15%', right: '8%', opacity: 0.1, color: 'white' }}>
          <ConstructionIcon sx={{ fontSize: 140 }} />
        </Box>
        <Box className="landing-pulse-ring" sx={{ position: 'absolute', top: '30%', right: '20%', width: 200, height: 200, borderRadius: '50%', border: '2px solid rgba(255,183,77,0.4)' }} />

        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography className="landing-fade-up landing-delay-1" variant="overline" sx={{ color: '#ffb74d', letterSpacing: 3, fontWeight: 700 }}>
                DEVBHOOMI DWARKA · GUJARAT
              </Typography>
              <Typography
                className="landing-fade-up landing-delay-2"
                variant="h2"
                sx={{ color: 'white', fontWeight: 800, mt: 1, mb: 2, fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' }, lineHeight: 1.15 }}
              >
                Moving Forward,{' '}
                <Box component="span" className="landing-shimmer-text">
                  Building Futures
                </Box>
              </Typography>
              <Typography className="landing-fade-up landing-delay-3" variant="h6" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 400, mb: 4, maxWidth: 560 }}>
                KK Enterprise — your trusted partner for transport logistics, tipper trucks and Hitachi excavator rentals across Gujarat.
              </Typography>
              <Box className="landing-fade-up landing-delay-4" sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => scrollTo('contact')}
                  sx={{ bgcolor: '#ed6c02', '&:hover': { bgcolor: '#e65100' }, px: 4 }}
                >
                  Get In Touch
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => scrollTo('services')}
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}
                >
                  Our Services
                </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box className="landing-fade-up landing-delay-3" sx={{ display: 'flex', justifyContent: 'center' }}>
                <Paper
                  elevation={24}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.97)',
                    maxWidth: 380,
                    width: '100%',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <CompanyLogo size="hero" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Registered transport & equipment rental company serving construction, mining and industrial sectors.
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <PhoneIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />
                      <PhoneLinks />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <BadgeIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />
                      <Typography variant="body2" fontWeight={600}>
                        GSTIN: {CONTACT.gstin}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats */}
      <Container maxWidth="lg" sx={{ mt: -6, position: 'relative', zIndex: 2 }}>
        <Paper elevation={8} sx={{ borderRadius: 4, p: { xs: 3, md: 4 } }}>
          <Grid container spacing={3} textAlign="center">
            {stats.map((s) => (
              <Grid size={{ xs: 6, md: 3 }} key={s.label}>
                <AnimatedCounter target={s.value} suffix={s.suffix} />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {s.label}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>

      {/* Services */}
      <Box id="services" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <RevealSection>
            <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={2}>
              WHAT WE DO
            </Typography>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Complete Transport & Equipment Solutions
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 5, maxWidth: 640 }}>
              From heavy-duty tipper transport to excavator rentals — KK Enterprise delivers reliable service with transparent pricing.
            </Typography>
          </RevealSection>
          <Grid container spacing={3}>
            {services.map((s, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={s.title}>
                <RevealSection sx={{ transitionDelay: `${i * 0.1}s` }}>
                  <Paper className="landing-card-hover" sx={{ p: 3, height: '100%', borderRadius: 3, borderTop: 4, borderColor: s.color }}>
                    <Box sx={{ color: s.color, mb: 2 }}>{s.icon}</Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {s.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {s.desc}
                    </Typography>
                  </Paper>
                </RevealSection>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* About */}
      <Box id="about" sx={{ py: { xs: 8, md: 10 }, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <RevealSection>
                <Typography variant="overline" color="primary" fontWeight={700}>
                  ABOUT KK ENTERPRISE
                </Typography>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  Built on Trust, Driven by Excellence
                </Typography>
                <Typography color="text.secondary" paragraph>
                  Based in Devbhoomi Dwarka, Gujarat, KK Enterprise has grown into a dependable name in transport and heavy equipment rental. We combine a modern fleet with professional operations to serve contractors, builders and industries.
                </Typography>
                <Typography color="text.secondary">
                  Our integrated ERP system ensures accurate trip records, diesel management, invoicing and fleet tracking — so you always get reliable, documented service.
                </Typography>
              </RevealSection>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RevealSection>
                <Box
                  sx={{
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 50%, #ed6c02 100%)',
                    p: 4,
                    color: 'white',
                    minHeight: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Why Choose Us?
                  </Typography>
                  {['GPS-tracked fleet & trip records', 'GST-compliant billing', 'Experienced drivers & operators', 'Flexible Hitachi rental plans', 'On-time delivery commitment'].map((item) => (
                    <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ffb74d' }} />
                      <Typography variant="body1">{item}</Typography>
                    </Box>
                  ))}
                </Box>
              </RevealSection>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Contact */}
      <Box id="contact" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <RevealSection sx={{ textAlign: 'center', mb: 5 }}>
            <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={2}>
              CONTACT US
            </Typography>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Let&apos;s Move Your Business Forward
            </Typography>
            <Typography color="text.secondary">
              Reach out for transport quotes, Hitachi rentals or fleet partnerships.
            </Typography>
          </RevealSection>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <RevealSection>
                <Paper className="landing-card-hover" sx={{ p: 3.5, borderRadius: 3, height: '100%', textAlign: 'center' }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                    <PhoneIcon />
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Call Us
                  </Typography>
                  <PhoneLinks centered />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Available Mon–Sat, 8 AM – 8 PM
                  </Typography>
                </Paper>
              </RevealSection>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <RevealSection>
                <Paper className="landing-card-hover" sx={{ p: 3.5, borderRadius: 3, height: '100%', textAlign: 'center' }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#ed6c02', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                    <BadgeIcon />
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    GSTIN
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ letterSpacing: 0.5 }}>
                    {CONTACT.gstin}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Registered under GST Act
                  </Typography>
                </Paper>
              </RevealSection>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <RevealSection>
                <Paper className="landing-card-hover" sx={{ p: 3.5, borderRadius: 3, height: '100%', textAlign: 'center' }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#2e7d32', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                    <LocationOnIcon />
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Office Address
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {CONTACT.address}
                  </Typography>
                  <Button
                    component="a"
                    href={CONTACT.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{ mt: 2 }}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Open in Maps
                  </Button>
                </Paper>
              </RevealSection>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer CTA */}
      <Box sx={{ py: 6, background: 'linear-gradient(135deg, #0d1642, #1a237e)' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <CompanyLogo size="xl" />
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mt: 2, mb: 1 }}>
            Ready to get started?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.75)', mb: 3 }}>
            Call {CONTACT.phones.map((p) => p.display).join(' · ')} or login to our ERP portal.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {CONTACT.phones.map((phone) => (
              <Button
                key={phone.number}
                component="a"
                href={`tel:${phone.number}`}
                variant="contained"
                size="large"
                sx={{ bgcolor: '#ed6c02', '&:hover': { bgcolor: '#e65100' } }}
                startIcon={<PhoneIcon />}
              >
                {phone.display}
              </Button>
            ))}
            <Button component={RouterLink} to={isAuthenticated ? '/dashboard' : '/auth/login'} variant="outlined" size="large" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>
              {isAuthenticated ? 'Open Dashboard' : 'Staff Login'}
            </Button>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: 3, bgcolor: '#0a1029', textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          © {new Date().getFullYear()} KK Enterprise · GSTIN {CONTACT.gstin} · {CONTACT.address.split(',')[0]}
        </Typography>
      </Box>
    </Box>
  );
}
