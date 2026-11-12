import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/config/routes'
import { BRAND_NAME } from '@/shared/config/brand'
import { BrandMark } from '@/shared/ui/brand'
import { DEFAULT_SITE_URL, getSiteUrl } from '@/shared/config/site'

const UPDATED_AT = '8 de novembro de 2026'

function LegalShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] antialiased">
      <header className="border-b border-[var(--color-border)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to={ROUTES.home} className="min-w-0">
            <BrandMark layout="horizontal" size="md" className="max-h-9" />
          </Link>
          <Link
            to={ROUTES.home}
            className="text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            Voltar ao início
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {BRAND_NAME}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          Última atualização: {UPDATED_AT}. Conteúdo inicial sujeito a revisão jurídica.
        </p>
        <div className="prose-legal mt-8 space-y-6 text-base leading-relaxed text-[var(--color-foreground)]">
          {children}
        </div>
        <nav className="mt-12 flex flex-wrap gap-4 border-t border-[var(--color-border)] pt-6 text-sm">
          <Link to={ROUTES.privacy} className="font-medium text-[var(--color-primary)] hover:underline">
            Política de Privacidade
          </Link>
          <Link to={ROUTES.terms} className="font-medium text-[var(--color-primary)] hover:underline">
            Termos de Uso
          </Link>
          <Link to={ROUTES.home} className="text-[var(--color-muted-foreground)] hover:underline">
            Início
          </Link>
        </nav>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

export function PrivacyPolicyPage() {
  const site = getSiteUrl() || DEFAULT_SITE_URL

  return (
    <LegalShell title="Política de Privacidade">
      <Section title="1. Quem somos">
        <p>
          O {BRAND_NAME} ({site}) é uma plataforma de gestão e tele-fisioterapia que conecta
          fisioterapeutas, pacientes e cuidadores autorizados. Esta política descreve como tratamos
          dados pessoais e dados relacionados à saúde no uso do site e, futuramente, dos aplicativos
          móveis.
        </p>
      </Section>

      <Section title="2. Dados que podemos coletar">
        <ul className="list-disc space-y-2 pl-5">
          <li>Dados de conta: nome, e-mail, senha (armazenada de forma segura pelo provedor de autenticação).</li>
          <li>Dados profissionais: informações de perfil do fisioterapeuta e da prática clínica.</li>
          <li>
            Dados de saúde e clínicos: prontuário, avaliações, check-ins, planos de exercício, registros de
            sessão e teleconsulta — fornecidos no contexto do atendimento.
          </li>
          <li>Dados de uso: logs técnicos, notificações in-app e métricas agregadas de produto.</li>
          <li>
            Dados de pagamento: processados por prestadores como Stripe; o {BRAND_NAME} não armazena o
            número completo do cartão.
          </li>
          <li>
            Dados de dispositivo (apps móveis): identificadores para push, permissões de câmera/microfone
            quando você inicia uma teleconsulta, e preferências locais (ex.: biometria apenas como
            desbloqueio de interface).
          </li>
        </ul>
      </Section>

      <Section title="3. Finalidades e bases legais (LGPD)">
        <p>Tratamos dados para:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>prestar o serviço contratado (execução de contrato / legítimo interesse operacional);</li>
          <li>teleconsulta e registros clínicos com consentimento e dever profissional aplicável;</li>
          <li>cobrança e prevenção a fraude;</li>
          <li>segurança, auditoria e cumprimento de obrigações legais;</li>
          <li>melhoria do produto com analytics (ex.: Google Analytics com IP anonimizado), quando aplicável.</li>
        </ul>
      </Section>

      <Section title="4. Compartilhamento com operadores">
        <p>Podemos utilizar operadores que processam dados em nosso nome, por exemplo:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Supabase (banco, autenticação, armazenamento);</li>
          <li>Stripe (pagamentos);</li>
          <li>Daily (salas de vídeo de teleconsulta);</li>
          <li>provedores de e-mail, hospedagem e, nos apps, serviço de push (ex.: OneSignal);</li>
          <li>Google (Analytics e, se conectado, Google Calendar).</li>
        </ul>
        <p>Não vendemos dados pessoais.</p>
      </Section>

      <Section title="5. Retenção e segurança">
        <p>
          Mantemos dados pelo tempo necessário às finalidades clínicas, contratuais e legais. Aplicamos
          controles como criptografia em trânsito (HTTPS), controle de acesso e políticas de segurança no
          banco (incluindo RLS). Tokens de sessão no navegador/app devem ser protegidos pelo usuário em
          dispositivos compartilhados (use logout).
        </p>
      </Section>

      <Section title="6. Seus direitos">
        <p>
          Nos termos da LGPD, você pode solicitar acesso, correção, portabilidade, eliminação (quando
          cabível), informação sobre compartilhamentos e revogação de consentimentos. Entre em contato pelo
          canal de suporte indicado no site ou no aplicativo.
        </p>
      </Section>

      <Section title="7. Crianças e adolescentes">
        <p>
          O serviço é voltado a profissionais e pacientes no contexto clínico. Contas de menores devem ser
          geridas sob responsabilidade legal do responsável e do profissional de saúde, conforme a legislação.
        </p>
      </Section>

      <Section title="8. Atualizações">
        <p>
          Podemos atualizar esta política. A data no topo indica a versão vigente. Mudanças relevantes
          poderão ser comunicadas no produto.
        </p>
      </Section>

      <Section title="9. Contato">
        <p>
          Dúvidas sobre privacidade: utilize o suporte do {BRAND_NAME} disponível em {site}. Substitua este
          contato pelo canal oficial (e-mail/DPO) após revisão jurídica.
        </p>
      </Section>
    </LegalShell>
  )
}

export function TermsOfUsePage() {
  const site = getSiteUrl() || DEFAULT_SITE_URL

  return (
    <LegalShell title="Termos de Uso">
      <Section title="1. Aceitação">
        <p>
          Ao acessar ou usar o {BRAND_NAME} ({site}), você concorda com estes Termos e com a{' '}
          <Link to={ROUTES.privacy} className="font-medium text-[var(--color-primary)] hover:underline">
            Política de Privacidade
          </Link>
          . Se não concordar, não utilize o serviço.
        </p>
      </Section>

      <Section title="2. Descrição do serviço">
        <p>
          O {BRAND_NAME} oferece ferramentas de agenda, prontuário, gestão de pacientes, comunicação,
          exercícios, check-ins e teleconsulta para fisioterapeutas e seus pacientes/cuidadores
          autorizados. O serviço pode ser oferecido via web e aplicativos móveis.
        </p>
      </Section>

      <Section title="3. Contas e responsabilidades">
        <ul className="list-disc space-y-2 pl-5">
          <li>Você é responsável pela veracidade dos dados e pela confidencialidade das credenciais.</li>
          <li>
            Fisioterapeutas são responsáveis pelo exercício profissional, registros clínicos, consentimentos
            e cumprimento de normas do conselho e da legislação sanitária.
          </li>
          <li>Pacientes e cuidadores devem usar o acesso apenas para as finalidades autorizadas.</li>
        </ul>
      </Section>

      <Section title="4. Planos e pagamentos">
        <p>
          Funcionalidades profissionais podem depender de assinatura ou trial, conforme oferta vigente no
          site. Cobranças de software (SaaS) e de serviços clínicos entre profissional e paciente seguem as
          regras comerciais e de pagamento aplicáveis (incluindo prestadores como Stripe). Cancelamentos e
          reembolsos seguem a política do plano e a legislação aplicável.
        </p>
      </Section>

      <Section title="5. Teleconsulta e conteúdo clínico">
        <p>
          A teleconsulta depende de conexão, dispositivo e permissões (câmera/microfone). O {BRAND_NAME}{' '}
          não substitui o julgamento clínico do profissional nem constitui diagnóstico automático. Em
          emergências, procure serviços de urgência locais.
        </p>
      </Section>

      <Section title="6. Uso aceitável">
        <p>
          É proibido tentar obter acesso não autorizado, interferir na segurança, usar o serviço para fins
          ilícitos, enviar malware ou violar direitos de terceiros. Podemos suspender contas que violem estes
          Termos.
        </p>
      </Section>

      <Section title="7. Propriedade intelectual">
        <p>
          Marca, interface, software e conteúdos do {BRAND_NAME} pertencem aos seus titulares. Conteúdos
          clínicos inseridos pelos usuários permanecem sob a responsabilidade e direitos aplicáveis a cada
          parte.
        </p>
      </Section>

      <Section title="8. Limitação de responsabilidade">
        <p>
          Na máxima extensão permitida pela lei, o {BRAND_NAME} não se responsabiliza por danos indiretos,
          lucros cessantes ou falhas de rede/terceiros (hospedagem, vídeo, pagamento). A responsabilidade
          total, quando cabível, limita-se aos valores pagos pelo serviço nos últimos 12 meses, salvo
          disposição legal em contrário.
        </p>
      </Section>

      <Section title="9. Alterações e foro">
        <p>
          Podemos alterar estes Termos; a data no topo indica a versão vigente. A legislação brasileira
          aplica-se a estas relações, com foro do domicílio do usuário consumidor quando a lei assim exigir,
          ou outro foro elegível após revisão jurídica.
        </p>
      </Section>

      <Section title="10. Contato">
        <p>
          Contato: suporte do {BRAND_NAME} em {site}. Atualize este campo com o canal oficial após revisão.
        </p>
      </Section>
    </LegalShell>
  )
}
