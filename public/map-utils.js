const DECIMALS = 6;

export function buildViewportQuery(bounds) {
  const params = new URLSearchParams({
    west: bounds.getWest().toFixed(DECIMALS),
    east: bounds.getEast().toFixed(DECIMALS),
    south: bounds.getSouth().toFixed(DECIMALS),
    north: bounds.getNorth().toFixed(DECIMALS)
  });

  return `/api/places?${params.toString()}`;
}

export function createRequestLock() {
  let currentRequestId = 0;
  let currentController;

  return {
    next() {
      currentController?.abort();
      currentController = new AbortController();
      currentRequestId += 1;
      return {
        id: currentRequestId,
        signal: currentController.signal
      };
    },
    isCurrent(id) {
      return id === currentRequestId;
    }
  };
}

export function geolocationMessage(errorCode, secureContext = window.isSecureContext) {
  const fallback = 'Exibindo área padrão de Fortaleza (CE).';

  if (!secureContext) {
    return `Geolocalização exige HTTPS. ${fallback}`;
  }

  if (errorCode === 1) {
    return `Permissão de geolocalização negada. ${fallback}`;
  }

  if (errorCode === 3) {
    return `Geolocalização demorou além do tempo limite. ${fallback}`;
  }

  if (errorCode === 2) {
    return `Localização indisponível no dispositivo. ${fallback}`;
  }

  return `Não foi possível obter sua localização. ${fallback}`;
}
