/* Create the initial request once, after email verification, from signup answers. */
window.acolherEnsureInitialIntake = async function(user) {
  if (!user?.email_confirmed_at) return false;
  const existing = async () => {
    const {data, error} = await window.sb.from('intake_requests').select('id').eq('user_id', user.id).limit(1).maybeSingle();
    if (error) throw new Error('Não foi possível verificar sua solicitação. Tente novamente.');
    return Boolean(data);
  };
  if (await existing()) return true;
  const meta = user.user_metadata || {}, answers = meta.registration_intake;
  if (!answers || answers.version !== 1) return false;
  const text = value => typeof value === 'string' ? value.trim() : '';
  const city = text(meta.city), details = text(meta.registration_details);
  const birthText = text(answers.birth_date), birth = new Date(`${birthText}T12:00:00`), today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(birthText) && Number.isFinite(age) && age >= 0 && age <= 120 && birth <= today
    && ['Para mim', 'Filho(a)', 'Familiar'].includes(meta.registration_for_whom)
    && text(meta.registration_reason).length >= 3 && text(meta.registration_reason).length <= 120
    && details.length >= 30 && details.length <= 1200 && city.length >= 2 && city.length <= 100
    && ['Presencial em Rio Claro', 'Online', 'Sem preferência'].includes(answers.modality)
    && ['Manhã', 'Tarde', 'Noite', 'Flexível'].includes(answers.preferred_period)
    && text(answers.preferred_days).length >= 2
    && ['Atendimento com valor social', 'Atendimento particular', 'Quero conhecer todas as possibilidades'].includes(answers.interest)
    && ['O quanto antes', 'Nas próximas semanas', 'Ainda estou pesquisando'].includes(answers.desired_start)
    && meta.privacy_accepted === true;
  if (!valid) throw new Error('Não foi possível recuperar todas as respostas do cadastro. Entre em contato com o Espaço Acolher.');
  // The user's UUID is the initial request ID: retries and concurrent devices cannot duplicate it.
  const {error} = await window.sb.from('intake_requests').insert({
    id: user.id, user_id: user.id, for_whom: meta.registration_for_whom, age, city,
    reason: text(meta.registration_reason), details,
    modality: answers.modality, preferred_period: answers.preferred_period,
    preferred_days: text(answers.preferred_days), interest: answers.interest,
    desired_start: answers.desired_start, consent_accepted: true
  });
  if (error && !(error.code === '23505' && await existing())) {
    throw new Error('Suas respostas continuam salvas no cadastro, mas não foi possível abrir o acompanhamento. Tente entrar novamente.');
  }
  return true;
};
