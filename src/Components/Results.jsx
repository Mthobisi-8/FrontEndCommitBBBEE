import React, { useRef, useState } from 'react';

const Results = ({ onClose, results = {} }) => {
  const {
    sector = "Generic",
    ownershipScore = 0,
    managementControlScore = 0,
    skillsDevelopmentScore = 0,
    esdScore = 0,
    socioEconomicDevelopmentScore = 0,
    yesBonusPoints = 0,
    totalScore = 0,
    maxScore = 100,
    bbeeLevel = "8",
    bbeeStatus = "Non-compliant",
    scorecard = {
      ownership: { weight: 25, target: 0.25 },
      managementControl: { weight: 15, target: 0.50 },
      skillsDevelopment: { weight: 20, target: 0.06 },
      esd: { weight: 20, target: 0.03 },
      socioEconomicDevelopment: { weight: 15, target: 0.01 },
      yesBonus: { weight: 5, target: 0.02 }
    },
    companyName = "Sample Company",
    yearEnd = "2024-02-28",
    turnover = 50000000,
    npat = 5000000,
    totalLeviableAmount = 3000000,
    totalMeasuredProcurementSpend = 20000000,
    assessmentType = "New",
  } = results;

  const modalContentRef = useRef(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      // Create a print-friendly version
      const printContent = modalContentRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>B-BBEE Report - ${companyName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px;
            }
            .summary-section {
              background-color: #f5f5f5;
              padding: 15px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .score-section {
              background-color: #e3f2fd;
              padding: 15px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .breakdown-item {
              background-color: #f5f5f5;
              padding: 10px;
              margin: 10px 0;
              border-radius: 5px;
            }
            .chart-placeholder {
              border: 2px dashed #ccc;
              padding: 40px;
              text-align: center;
              margin: 20px 0;
              color: #666;
            }
            .recommendations {
              margin-top: 30px;
            }
            .recommendations ul {
              list-style-type: disc;
              padding-left: 20px;
            }
            .recommendations li {
              margin: 10px 0;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 20px;
            }
            @page {
              margin: 2cm;
            }
          </style>
        </head>
        <body>
          ${printContent}
          <div class="footer">
            Generated on ${new Date().toLocaleString()} | ${companyName} B-BBEE Assessment Report
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try the print function instead.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Data for Bar Chart
  const barChartData = [
    {
      category: 'Ownership',
      Actual: parseFloat(ownershipScore.toFixed(2)),
      Max: scorecard.ownership.weight,
    },
    {
      category: 'Management',
      Actual: parseFloat(managementControlScore.toFixed(2)),
      Max: scorecard.managementControl.weight,
    },
    {
      category: 'Skills Dev',
      Actual: parseFloat(skillsDevelopmentScore.toFixed(2)),
      Max: scorecard.skillsDevelopment.weight,
    },
    {
      category: 'ESD',
      Actual: parseFloat(esdScore.toFixed(2)),
      Max: scorecard.esd.weight,
    },
    {
      category: 'Socio-Economic',
      Actual: parseFloat(socioEconomicDevelopmentScore.toFixed(2)),
      Max: scorecard.socioEconomicDevelopment.weight,
    },
    ...(yesBonusPoints > 0
      ? [{
          category: 'YES Bonus',
          Actual: parseFloat(yesBonusPoints.toFixed(2)),
          Max: scorecard.yesBonus.weight,
        }]
      : []),
  ];

  // Data for Pie Chart
  const pieChartData = [
    {
      name: 'Ownership',
      value: parseFloat(ownershipScore.toFixed(2)),
      color: '#4CAF50',
    },
    {
      name: 'Management',
      value: parseFloat(managementControlScore.toFixed(2)),
      color: '#2196F3',
    },
    {
      name: 'Skills Dev',
      value: parseFloat(skillsDevelopmentScore.toFixed(2)),
      color: '#FFC107',
    },
    {
      name: 'ESD',
      value: parseFloat(esdScore.toFixed(2)),
      color: '#F44336',
    },
    {
      name: 'Socio-Economic',
      value: parseFloat(socioEconomicDevelopmentScore.toFixed(2)),
      color: '#9C27B0',
    },
    ...(yesBonusPoints > 0
      ? [{
          name: 'YES Bonus',
          value: parseFloat(yesBonusPoints.toFixed(2)),
          color: '#009688',
        }]
      : []),
  ];

  // Format currency for South African Rand
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-ZA', { 
      style: 'currency', 
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate percentage of total score achieved
  const scorePercentage = ((totalScore / maxScore) * 100).toFixed(1);

  // Get level color based on B-BBEE level
  const getLevelColor = (level) => {
    const levelNum = parseInt(level);
    if (levelNum <= 2) return 'text-green-600 bg-green-100';
    if (levelNum <= 4) return 'text-blue-600 bg-blue-100';
    if (levelNum <= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Custom Bar Chart Component
  const CustomBarChart = ({ data }) => {
    const maxValue = Math.max(...data.map(item => Math.max(item.Actual, item.Max)));
    
    return (
      <div className="w-full">
        <div className="flex items-end justify-around h-64 bg-gray-50 p-4 rounded-lg border-b border-gray-200">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center space-y-2">
              <div className="flex space-x-1 items-end" style={{ height: '200px' }}>
                {/* Actual Score Bar */}
                <div className="relative">
                  <div
                    className="bg-green-500 rounded-t w-8 transition-all duration-1000 ease-out"
                    style={{
                      height: `${(item.Actual / maxValue) * 180}px`,
                      minHeight: '4px'
                    }}
                  />
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700">
                    {item.Actual}
                  </div>
                </div>
                {/* Max Score Bar */}
                <div className="relative">
                  <div
                    className="bg-gray-300 rounded-t w-8"
                    style={{
                      height: `${(item.Max / maxValue) * 180}px`,
                      minHeight: '4px'
                    }}
                  />
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700">
                    {item.Max}
                  </div>
                </div>
              </div>
              <div className="text-xs text-center font-medium text-gray-600 max-w-16">
                {item.category}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4 space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Actual Score</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">Maximum Score</span>
          </div>
        </div>
      </div>
    );
  };

  // Custom Pie Chart Component
  const CustomPieChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    const createArcPath = (centerX, centerY, radius, startAngle, endAngle) => {
      const start = polarToCartesian(centerX, centerY, radius, endAngle);
      const end = polarToCartesian(centerX, centerY, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      
      return [
        "M", centerX, centerY,
        "L", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
      ].join(" ");
    };

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };

    return (
      <div className="w-full flex flex-col items-center">
        <svg viewBox="0 0 300 300" className="w-full max-w-md">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const startAngle = cumulativePercentage * 3.6;
            const endAngle = (cumulativePercentage + percentage) * 3.6;
            
            const pathData = createArcPath(150, 150, 100, startAngle, endAngle);
            cumulativePercentage += percentage;
            
            return (
              <path
                key={index}
                d={pathData}
                fill={item.color}
                stroke="white"
                strokeWidth="2"
                className="hover:opacity-80 transition-opacity duration-200"
              />
            );
          })}
          {/* Center circle for donut effect */}
          <circle cx="150" cy="150" r="60" fill="white" />
          <text x="150" y="145" textAnchor="middle" className="text-lg font-bold fill-gray-700">
            Total
          </text>
          <text x="150" y="165" textAnchor="middle" className="text-xl font-bold fill-blue-600">
            {total.toFixed(1)}
          </text>
        </svg>
        <div className="grid grid-cols-2 gap-2 mt-4 w-full max-w-md">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-gray-600">
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <div 
          ref={modalContentRef} 
          className="p-6"
        >
          {/* Header */}
          <div className="header mb-8 text-center border-b-2 border-gray-300 pb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              B-BBEE Assessment Results
            </h2>
            <h3 className="text-xl text-gray-600 mb-2">
              {companyName} ({sector} Sector)
            </h3>
            <p className="text-gray-500">
              Financial Year End: {yearEnd || 'Not specified'} | Assessment Type: {assessmentType || 'New'}
            </p>
          </div>

          {/* Overall Score Highlight */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Overall B-BBEE Score</h3>
              <div className="flex justify-center items-center gap-8 mb-4">
                <div className="text-center">
                  <p className="text-5xl font-bold text-blue-600">{totalScore.toFixed(2)}</p>
                  <p className="text-lg text-gray-600">out of {maxScore}</p>
                  <p className="text-sm text-gray-500">({scorePercentage}%)</p>
                </div>
                <div className="text-center">
                  <div className={`inline-block px-4 py-2 rounded-lg ${getLevelColor(bbeeLevel)}`}>
                    <p className="text-2xl font-bold">Level {bbeeLevel}</p>
                  </div>
                  <p className="text-lg mt-2 text-gray-700">
                    Recognition: {bbeeStatus}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Financial Summary */}
          <div className="summary-section mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Company Financial Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">Turnover</p>
                <p className="text-lg font-semibold">{formatCurrency(turnover)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">NPAT</p>
                <p className="text-lg font-semibold">{formatCurrency(npat)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">Leviable Amount</p>
                <p className="text-lg font-semibold">{formatCurrency(totalLeviableAmount)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">Procurement Spend</p>
                <p className="text-lg font-semibold">{formatCurrency(totalMeasuredProcurementSpend)}</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Score Analysis</h3>
            
            {/* Bar Chart */}
            <div className="mb-8 bg-white p-6 rounded-lg border">
              <h4 className="text-lg font-medium mb-4 text-gray-700">Score Comparison by Element</h4>
              <CustomBarChart data={barChartData} />
            </div>

            {/* Pie Chart */}
            <div className="mb-8 bg-white p-6 rounded-lg border">
              <h4 className="text-lg font-medium mb-4 text-gray-700">Score Distribution</h4>
              <CustomPieChart data={pieChartData} />
            </div>
          </div>

          {/* Detailed Score Breakdown */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Detailed Score Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {barChartData.map((item, index) => (
                <div key={index} className="breakdown-item bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-800">{item.category}</h4>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm">
                      <span>Actual Score:</span>
                      <span className="font-semibold">{item.Actual}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Maximum Score:</span>
                      <span className="font-semibold">{item.Max}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(item.Actual / item.Max) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {((item.Actual / item.Max) * 100).toFixed(1)}% achieved
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="recommendations mb-8 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Recommendations for Improvement</h3>
            <ul className="space-y-3">
              {ownershipScore < scorecard.ownership.weight && (
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Increase black ownership to meet the sector target of {(scorecard.ownership.target * 100).toFixed(0)}%.</span>
                </li>
              )}
              {managementControlScore < scorecard.managementControl.weight && (
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Enhance black representation in management to meet the sector target of {(scorecard.managementControl.target * 100).toFixed(0)}%.</span>
                </li>
              )}
              {skillsDevelopmentScore < scorecard.skillsDevelopment.weight && (
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Invest at least {formatCurrency(totalLeviableAmount * scorecard.skillsDevelopment.target)} in skills development programs.</span>
                </li>
              )}
              {esdScore < scorecard.esd.weight && (
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Improve ESD by increasing procurement from black-owned suppliers and enterprise development contributions.</span>
                </li>
              )}
              {socioEconomicDevelopmentScore < scorecard.socioEconomicDevelopment.weight && (
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Contribute at least {formatCurrency(npat * scorecard.socioEconomicDevelopment.target)} to socio-economic development initiatives.</span>
                </li>
              )}
              {yesBonusPoints < scorecard.yesBonus.weight && (
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Increase participation in the YES 4 Youth Initiative to earn up to {scorecard.yesBonus.weight} bonus points.</span>
                </li>
              )}
              {ownershipScore >= scorecard.ownership.weight && 
               managementControlScore >= scorecard.managementControl.weight && 
               skillsDevelopmentScore >= scorecard.skillsDevelopment.weight && 
               esdScore >= scorecard.esd.weight && 
               socioEconomicDevelopmentScore >= scorecard.socioEconomicDevelopment.weight && (
                <li className="flex items-start text-green-700">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Excellent performance! You're meeting all key targets. Consider maintaining these levels and exploring opportunities to exceed them.</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 p-6 bg-gray-50 border-t">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors duration-200 flex items-center gap-2"
          >
            {isGeneratingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;