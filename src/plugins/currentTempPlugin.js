const currentTempPlugin = {
    id: 'currentTempPlugin',
    beforeDraw: (chart, args, options) => {
        const {ctx} = chart;
    },
    afterDraw: (chart, args, options) => {
        const {ctx} = chart;
        const currentTemp = options.getCurrentTemp();

        const currentTempXPos = chart.scales.x.getPixelForValue(currentTemp);
        ctx.beginPath();
        ctx.moveTo(currentTempXPos, chart.chartArea.top);
        ctx.lineTo(currentTempXPos, chart.chartArea.bottom);
        ctx.strokeStyle = options.color;
        ctx.stroke();
    },
    defaults: {
        color: 'red'
    }
};

export default currentTempPlugin;