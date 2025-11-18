import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Dumbbell, BarChart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { placeholderImages } from '@/lib/data';

export default function LandingPage() {
  const features = [
    {
      icon: <Dumbbell className="h-8 w-8 text-primary" />,
      title: 'Biblioteca de Treinos',
      description: 'Navegue por uma coleção de rotinas de treino predefinidas para todos os níveis de condicionamento físico.',
    },
    {
      icon: <BarChart className="h-8 w-8 text-primary" />,
      title: 'Acompanhamento de Progresso',
      description: 'Registre seus treinos e visualize seu progresso com gráficos e tabelas detalhados.',
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: 'Treinos Personalizados',
      description: 'Crie e salve suas próprias rotinas de treino adaptadas aos seus objetivos pessoais.',
    },
  ];

  const heroImage = placeholderImages.find(p => p.id === 'hero-landing');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-20">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Logo />
          <span className="sr-only">FitTrack</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" asChild>
            <Link href="/login">
              Entrar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/signup">
              Comece Agora <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full h-[80vh] pt-12 md:pt-24 lg:pt-32 flex items-center justify-center">
            {heroImage && (
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                priority
                data-ai-hint={heroImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="container px-4 md:px-6 text-center relative z-10">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-foreground font-headline">
                  Construa seu Melhor Eu com FitTrack
                </h1>
                <p className="mt-4 text-muted-foreground md:text-xl">
                  Sua jornada de fitness pessoal, simplificada. Acompanhe treinos, visualize o progresso e atinja seus objetivos.
                </p>
                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
                   <Button size="lg" asChild>
                    <Link href="/signup">
                      Comece Gratuitamente
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline">
                    Saiba Mais
                  </Button>
                </div>
              </div>
            </div>
        </section>
        
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Recursos Principais</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Mais Rápido, Melhor, Mais Forte</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  O FitTrack fornece as ferramentas que você precisa para ter sucesso em sua jornada de fitness.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              {features.map((feature) => (
                <Card key={feature.title} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center gap-4">
                    {feature.icon}
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 FitTrack. Todos os direitos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Termos de Serviço
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacidade
          </Link>
        </nav>
      </footer>
    </div>
  );
}
