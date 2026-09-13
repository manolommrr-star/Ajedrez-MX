/**
 * Adaptador de integración: CHESS-RESULTS (referencia externa).
 *
 * La plataforma NO clona Chess-Results: guarda la referencia
 * (chessResultsId + chessResultsUrl) en el torneo y muestra el enlace
 * a la publicación oficial.
 */
export const ChessResultsLinks = {
  /** Devuelve { id, url } si el torneo tiene publicación, o null. */
  deTorneo(torneo) {
    if (!torneo || !torneo.chessResultsUrl) return null;
    return {
      id: torneo.chessResultsId,
      url: torneo.chessResultsUrl
    };
  }
};