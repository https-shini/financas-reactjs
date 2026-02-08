export const exportToCsv = (data) => {
    if (!data || data.length === 0) return;

    const headers = ["Descrição", "Valor", "Tipo"];
    const csvRows = [
        headers.join(","),
        ...data.map(item => [
            `"${item.desc}"`,
            item.amount,
            item.expense ? "Saída" : "Entrada"
        ].join(","))
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transacoes_financeiras.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
