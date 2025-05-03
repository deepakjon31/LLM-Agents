import { Chart, registerables } from 'chart.js/auto';

// Register all Chart.js components
Chart.register(...registerables);

/**
 * Format visualization data for Chart.js
 * @param visualizationData The data returned from the API
 * @returns Properly formatted data for Chart.js
 */
export const formatChartData = (visualizationData: any) => {
  if (!visualizationData) return null;
  
  return {
    labels: visualizationData.data?.labels || [],
    datasets: (visualizationData.data?.datasets || []).map((dataset: any) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || 
        ['rgba(54, 162, 235, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)']
    }))
  };
};

// Export a configured Chart instance
export default Chart; 