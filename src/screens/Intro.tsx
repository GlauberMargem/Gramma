import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { MaterialIcon } from '../components/MaterialIcon';
import { markIntroSeen } from '../boot';

export function Intro() {
  const navigate = useNavigate();
  const screenRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      // Como no legado, a intro conta como vista assim que começa a tocar.
      markIntroSeen();
      const eyebrow = eyebrowRef.current;
      const logo = logoRef.current;
      const title = titleRef.current;
      const subtitle = subtitleRef.current;
      const screen = screenRef.current;
      if (!eyebrow || !logo || !title || !subtitle || !screen) return;

      // O legado não trata prefers-reduced-motion na intro; mantida a paridade.
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: () => navigate('/', { replace: true }),
      });
      timelineRef.current = tl;

      tl.set([eyebrow, logo, title, subtitle], { opacity: 0 })
        .set(logo, { scale: 0.7, y: 10 })
        .set(title, { y: 20 })
        .to(eyebrow, { opacity: 1, duration: 0.5 })
        .to(logo, { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)' }, '-=0.1')
        .to({}, { duration: 0.7 })
        .to([logo, eyebrow], { opacity: 0, y: -10, duration: 0.45 })
        .to(title, { opacity: 1, y: 0, duration: 0.7, ease: 'back.out(1.6)' })
        .to(subtitle, { opacity: 1, duration: 0.5 }, '-=0.2')
        .to(screen, { opacity: 0, duration: 0.6 }, '+=1');

      return () => {
        tl.kill();
        timelineRef.current = null;
      };
    },
    { scope: screenRef },
  );

  const skip = () => {
    timelineRef.current?.kill();
    timelineRef.current = null;
    navigate('/', { replace: true });
  };

  return (
    <section ref={screenRef} className="intro-screen">
      <button className="intro-skip-btn" type="button" onClick={skip}>
        Pular
        <MaterialIcon name="skip_next" />
      </button>

      <p ref={eyebrowRef} className="intro-eyebrow">
        Trabalho da disciplina de Jogos Digitais
      </p>
      <img ref={logoRef} className="intro-logo" src={`${import.meta.env.BASE_URL}unirios-logo.png`} alt="Logo UniRios" />

      <h1 ref={titleRef} className="intro-title">
        <MaterialIcon name="psychology" />
        GRAMMA
      </h1>
      <p ref={subtitleRef} className="intro-subtitle">
        Desafio Gramatical &amp; Sintático Diário
      </p>
    </section>
  );
}
