const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es l'Assistant IA d'Al Handassa.dz, la plateforme algérienne de référence pour les ingénieurs et techniciens du génie civil et BTP.

Ton rôle :
- Répondre aux questions techniques sur le génie civil, le BTP, l'architecture, la topographie, la mécanique des sols, le béton, la résistance des matériaux, l'hydraulique, etc.
- Aider les utilisateurs à trouver des ressources sur la plateforme (cours, logiciels, vidéos, entreprises)
- Expliquer les normes algériennes (DTR, RPA, BAEL, etc.)
- Donner des conseils pratiques pour les chantiers algériens
- Répondre en français par défaut, en arabe ou anglais si l'utilisateur le demande

Ton style :
- Réponses claires, précises et professionnelles
- Utilise des exemples concrets adaptés au contexte algérien
- Cite les normes DTR/RPA algériennes quand c'est pertinent
- Reste concis (3-5 paragraphes max sauf demande explicite)

Ce que tu ne fais PAS :
- Tu ne traites pas de sujets hors génie civil / BTP / architecture
- Tu ne donnes pas de conseils médicaux, juridiques ou financiers personnels
- Tu ne mentionnes pas de concurrents directs d'Al Handassa.dz`;

exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages[] requis.' });
    }

    // Garder max 20 tours pour éviter les coûts excessifs
    const history = messages.slice(-20).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 4000),
    }));

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: history,
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    res.json({ reply: text, usage: response.usage });
  } catch (err) {
    console.error('[Assistant IA]', err.message);
    if (err.status === 401) {
      return res.status(503).json({ error: 'Clé API Anthropic non configurée.' });
    }
    res.status(500).json({ error: 'Erreur assistant IA. Veuillez réessayer.' });
  }
};
