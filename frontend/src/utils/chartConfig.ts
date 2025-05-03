import { Chart, registerables } from 'chart.js/auto';

// Register all Chart.js components
Chart.register(...registerables);

// Default colors for charts
const DEFAULT_COLORS = {
  backgrounds: [
    'rgba(54, 162, 235, 0.5)',
    'rgba(75, 192, 192, 0.5)',
    'rgba(153, 102, 255, 0.5)',
    'rgba(255, 159, 64, 0.5)',
    'rgba(255, 99, 132, 0.5)'
  ],
  borders: [
    'rgb(54, 162, 235)',
    'rgb(75, 192, 192)',
    'rgb(153, 102, 255)',
    'rgb(255, 159, 64)',
    'rgb(255, 99, 132)'
  ]
};

/**
 * Format visualization data for Chart.js
 * @param visualizationData The data returned from the API
 * @returns Properly formatted data for Chart.js
 */
export const formatChartData = (visualizationData: any) => {
  if (!visualizationData || !visualizationData.data) {
    console.error('Invalid visualization data:', visualizationData);
    return null;
  }
  
  // Extract labels and datasets
  const { labels = [], datasets = [] } = visualizationData.data;
  
  // Format datasets with proper colors if not provided
  const formattedDatasets = datasets.map((dataset: any, index: number) => {
    // Ensure we have enough colors for all data points
    const dataLength = dataset.data?.length || 0;
    const backgroundColors = dataset.backgroundColor || 
      Array(dataLength).fill(DEFAULT_COLORS.backgrounds[index % DEFAULT_COLORS.backgrounds.length]);
    const borderColors = dataset.borderColor || 
      Array(dataLength).fill(DEFAULT_COLORS.borders[index % DEFAULT_COLORS.borders.length]);
    
    return {
      ...dataset,
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      borderWidth: dataset.borderWidth || 1
    };
  });
  
  console.log('Formatted chart data:', { labels, datasets: formattedDatasets });
  
  return {
    labels,
    datasets: formattedDatasets
  };
};

// Export a configured Chart instance
export default Chart; 