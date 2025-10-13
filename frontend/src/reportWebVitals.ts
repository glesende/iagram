import { ReportHandler } from 'web-vitals';

// Send Web Vitals to Google Analytics 4
const sendToGoogleAnalytics = ({ name, delta, value, id }: any) => {
  // Check if gtag is available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', name, {
      event_category: 'Web Vitals',
      value: Math.round(name === 'CLS' ? delta * 1000 : delta),
      event_label: id,
      non_interaction: true,
    });
  }
};

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }

  // Always send Web Vitals to Google Analytics if gtag is available
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(sendToGoogleAnalytics);
    getFID(sendToGoogleAnalytics);
    getFCP(sendToGoogleAnalytics);
    getLCP(sendToGoogleAnalytics);
    getTTFB(sendToGoogleAnalytics);
  });
};

export default reportWebVitals;
