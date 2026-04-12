// Module de gestion des soumissions audio — QuranReview
// supabaseClient est exposé globalement par supabase-client.js
const supabaseClient = window.supabaseClient

// Taille maximale autorisée pour les fichiers audio (10 Mo)
const MAX_AUDIO_SIZE = 10 * 1024 * 1024
// Extensions audio autorisées
const ALLOWED_EXTENSIONS = ['.webm', '.mp3', '.wav', '.m4a']

/**
 * Valide un fichier audio avant upload.
 * @param {Blob|File} audioBlob
 * @returns {{ valid: boolean, error: string|null }}
 */
function validateAudio(audioBlob) {
  if (audioBlob.size > MAX_AUDIO_SIZE) {
    return { valid: false, error: 'Fichier trop volumineux (max 10 Mo)' }
  }

  // Vérification de l'extension si c'est un File
  if (audioBlob.name) {
    const ext = audioBlob.name.toLowerCase().slice(audioBlob.name.lastIndexOf('.'))
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `Extension non autorisée. Formats acceptés : ${ALLOWED_EXTENSIONS.join(', ')}` }
    }
  }

  return { valid: true, error: null }
}

/**
 * Récupère les soumissions de l'utilisateur connecté.
 */
export async function getMySubmissions() {
  try {
    const { data: authData, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authData?.user) return { data: null, error: authError }
    const user = authData.user

    const { data, error } = await supabaseClient
      .from('submissions')
      .select('*, tasks(*)')
      .eq('student_id', user.id)
      .order('submitted_at', { ascending: false })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Récupère les soumissions en attente de validation (prof/admin).
 */
export async function getPendingSubmissions() {
  try {
    const { data, error } = await supabaseClient
      .from('submissions')
      .select('*, tasks(*), profiles!student_id(*)')
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: true })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Upload un fichier audio dans le bucket 'audio-submissions'.
 * Chemin : {uid}/{taskId}/{timestamp}.webm
 * @param {string} taskId - UUID de la tâche
 * @param {Blob|File} audioBlob - fichier audio
 * @returns {{ data: { url: string }|null, error }}
 */
export async function uploadAudio(taskId, audioBlob) {
  try {
    // Validation avant upload
    const { valid, error: validationError } = validateAudio(audioBlob)
    if (!valid) return { data: null, error: new Error(validationError) }

    const { data: authData, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authData?.user) return { data: null, error: authError }
    const user = authData.user

    const timestamp = Date.now()
    const ext = audioBlob.name
      ? audioBlob.name.slice(audioBlob.name.lastIndexOf('.'))
      : '.webm'
    const filePath = `${user.id}/${taskId}/${timestamp}${ext}`

    const { error: uploadError } = await supabaseClient.storage
      .from('audio-submissions')
      .upload(filePath, audioBlob, { contentType: audioBlob.type || 'audio/webm' })

    if (uploadError) return { data: null, error: uploadError }

    // Génération d'une URL signée valable 1 heure
    const { data: signedData, error: signedError } = await supabaseClient.storage
      .from('audio-submissions')
      .createSignedUrl(filePath, 3600)

    if (signedError) return { data: null, error: signedError }

    return { data: { url: signedData.signedUrl }, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Crée une soumission en base après upload audio.
 * @param {string} taskId - UUID de la tâche
 * @param {string} audioUrl - URL signée du fichier audio
 */
export async function createSubmission(taskId, audioUrl) {
  try {
    const { data: authData, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authData?.user) return { data: null, error: authError }
    const user = authData.user

    const { data, error } = await supabaseClient
      .from('submissions')
      .insert({
        task_id: taskId,
        student_id: user.id,
        audio_url: audioUrl,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Approuve une soumission et attribue les points.
 * Met à jour la soumission + insère dans points_log.
 * @param {string} submissionId - UUID de la soumission
 * @param {number} awardedPoints - points attribués
 * @param {string} feedback - commentaire du validateur
 */
export async function approveSubmission(submissionId, awardedPoints, feedback) {
  try {
    const { data: authData, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authData?.user) return { data: null, error: authError }
    const user = authData.user

    // Récupération de la soumission pour obtenir le student_id
    const { data: submission, error: fetchError } = await supabaseClient
      .from('submissions')
      .select('student_id, task_id')
      .eq('id', submissionId)
      .single()

    if (fetchError) return { data: null, error: fetchError }

    // Mise à jour de la soumission
    const { data, error: updateError } = await supabaseClient
      .from('submissions')
      .update({
        status: 'approved',
        awarded_points: awardedPoints,
        admin_feedback: feedback,
        validated_at: new Date().toISOString(),
        validated_by: user.id,
      })
      .eq('id', submissionId)
      .select()
      .single()

    if (updateError) return { data: null, error: updateError }

    // Insertion dans points_log
    const { error: logError } = await supabaseClient
      .from('points_log')
      .insert({
        student_id: submission.student_id,
        delta: awardedPoints,
        reason: 'Soumission approuvée',
        submission_id: submissionId,
      })

    if (logError) return { data: null, error: logError }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Rejette une soumission avec un commentaire.
 * @param {string} submissionId - UUID de la soumission
 * @param {string} feedback - raison du rejet
 */
export async function rejectSubmission(submissionId, feedback) {
  try {
    const { data, error } = await supabaseClient
      .from('submissions')
      .update({
        status: 'rejected',
        admin_feedback: feedback,
      })
      .eq('id', submissionId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
