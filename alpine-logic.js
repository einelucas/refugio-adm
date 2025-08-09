function flowerShopApp() {
  return {
    // Estado da aplicação
    user: null,
    loading: false,
    error: "",
    activeTab: "estoque",

    // Dados
    stock: [],
    products: [],
    sales: [],
    expenses: [],

    // Formulários
    loginData: {
      username: "",
      password: "",
    },
    stockForm: {
      id: null,
      name: "",
      quantity: 0,
    },
    productForm: {
      id: null,
      name: "",
      price: 0,
      ingredients: [],
    },
    productionForm: {
      productId: "",
      quantity: 1,
    },
    saleForm: {
      productId: "",
      quantity: 1,
      customer: "",
    },
    expenseForm: {
      description: "",
      amount: 0,
      category: "",
    },
    reportFilters: {
      month: "",
      year: new Date().getFullYear(),
    },

    // Pesquisa e filtros
    stockSearch: "",
    stockOrder: "asc",
    productSearch: "",
    report: null,

    // Inicialização
    async init() {
      console.log("Inicializando aplicação...");
      // Aguarda um pouco para garantir que o Firebase está pronto
      setTimeout(() => {
        this.loadData();
      }, 500);
    },

    login: function () {
      this.loading = true;
      this.error = "";

      let email = "";
      let senha = this.loginData.password;

      if (this.loginData.username === "LucasP") {
        email = "lucas@refugio.com.br"; // coloque o e-mail do Lucas que você criou no Firebase
      } else if (this.loginData.username === "EduardaP") {
        email = "eduarda@refugio.com.br"; // coloque o e-mail da Eduarda criado no Firebase
      } else {
        this.error = "Usuário inválido";
        this.loading = false;
        return;
      }

      firebase
        .auth()
        .signInWithEmailAndPassword(email, senha)
        .then((userCredential) => {
          this.user = userCredential.user;
          const nomes = {
            LucasP: "Lucas Pinheiro",
            EduardaP: "Maria Eduarda",
          };
          const nomeExibicao =
            nomes[this.loginData.username] || this.user.email;
          console.log("Logado como:", nomeExibicao);
          // Atualiza o texto do header com o nome
          const headerNome = document.getElementById("header-username");
          if (headerNome) {
            headerNome.textContent = nomeExibicao;
          }
          this.loadData();
        })
        .catch((error) => {
          console.error("Erro no login:", error);
          this.error = "Usuário ou senha incorretos";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async logout() {
      this.user = null;
      this.loginData = { username: "", password: "" };
      // Limpar dados ao fazer logout
      this.stock = [];
      this.products = [];
      this.sales = [];
      this.expenses = [];
    },

    // Carregamento de dados
    async loadData() {
      try {
        // Listener para estoque
        db.collection("stock").onSnapshot((snapshot) => {
          this.stock = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          this.$nextTick(() => {
            // Força a reatividade do Alpine.js
            this.stock = [...this.stock];
          });
        });

        // Listener para produtos
        db.collection("products").onSnapshot((snapshot) => {
          console.log("Products data updated:", snapshot.docs.length);
          this.products = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          this.$nextTick(() => {
            this.products = [...this.products];
          });
        });

        // Listener para vendas
        db.collection("sales").onSnapshot((snapshot) => {
          console.log("Sales data updated:", snapshot.docs.length);
          this.sales = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          this.$nextTick(() => {
            this.sales = [...this.sales];
          });
        });

        // Listener para despesas
        db.collection("expenses").onSnapshot((snapshot) => {
          console.log("Expenses data updated:", snapshot.docs.length);
          this.expenses = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          this.$nextTick(() => {
            this.expenses = [...this.expenses];
          });
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        // Fallback para dados locais se Firebase falhar
      }
    },

    // Métodos para reset de formulários
    editStock(item) {
      this.stockForm = { ...item };
    },

    resetStockForm() {
      this.stockForm = { id: null, name: "", quantity: 0 };
    },

    ingredientSearch: [],

    filteredStockByIndex(index) {
      const search = this.ingredientSearch[index] || "";
      if (search.trim() === "") return this.stock;
      return this.stock.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    },

    addIngredient() {
      this.productForm.ingredients.push({ stockId: "", quantity: 0 });
      this.ingredientSearch.push("");
    },

    removeIngredient(index) {
      this.productForm.ingredients.splice(index, 1);
      this.ingredientSearch.splice(index, 1);
    },

    editProduct(product) {
      this.productForm = {
        ...product,
        ingredients: [...product.ingredients],
      };
    },

    resetProductForm() {
      this.productForm = {
        id: null,
        name: "",
        price: 0,
        ingredients: [],
      };
    },

    // Gestão de Estoque
    async saveStock() {
      try {
        console.log("Salvando estoque:", this.stockForm);

        if (this.stockForm.id) {
          // Atualizar item existente
          await db
            .collection("stock")
            .doc(this.stockForm.id)
            .update({
              name: this.stockForm.name,
              quantity: parseFloat(this.stockForm.quantity),
            });
          console.log("Estoque atualizado com sucesso");
        } else {
          // Adicionar novo item
          const docRef = await db.collection("stock").add({
            name: this.stockForm.name,
            quantity: parseFloat(this.stockForm.quantity),
          });
          console.log("Novo item de estoque adicionado com ID:", docRef.id);
        }

        this.resetStockForm();
        alert("Item salvo com sucesso!");
      } catch (error) {
        console.error("Erro ao salvar estoque:", error);
        alert("Erro ao salvar. Tente novamente.");
      }
    },

    async deleteStock(id) {
      if (confirm("Tem certeza que deseja excluir este item?")) {
        try {
          await db.collection("stock").doc(id).delete();
        } catch (error) {
          console.error("Erro ao excluir estoque:", error);
        }
      }
    },

    // Gestão de Produtos
    async saveProduct() {
      try {
        console.log("Salvando produto:", this.productForm);

        if (this.productForm.id) {
          // Atualizar produto existente
          await db
            .collection("products")
            .doc(this.productForm.id)
            .update({
              name: this.productForm.name,
              price: parseFloat(this.productForm.price),
              ingredients: this.productForm.ingredients.map((ing) => ({
                stockId: ing.stockId,
                quantity: parseFloat(ing.quantity),
              })),
            });
          console.log("Produto atualizado com sucesso");
        } else {
          // Adicionar novo produto
          const docRef = await db.collection("products").add({
            name: this.productForm.name,
            price: parseFloat(this.productForm.price),
            ingredients: this.productForm.ingredients.map((ing) => ({
              stockId: ing.stockId,
              quantity: parseFloat(ing.quantity),
            })),
          });
          console.log("Novo produto adicionado com ID:", docRef.id);
        }

        this.resetProductForm();
        alert("Produto salvo com sucesso!");
      } catch (error) {
        console.error("Erro ao salvar produto:", error);
        alert("Erro ao salvar produto. Tente novamente.");
      }
    },

    async deleteProduct(id) {
      if (confirm("Tem certeza que deseja excluir este produto?")) {
        try {
          await db.collection("products").doc(id).delete();
        } catch (error) {
          console.error("Erro ao excluir produto:", error);
        }
      }
    },

    // Produção
    async produce() {
      if (!this.productionForm.productId) return;

      const product = this.products.find(
        (p) => p.id === this.productionForm.productId
      );
      if (!product) return;

      const quantity = parseInt(this.productionForm.quantity) || 1;

      // Verificar disponibilidade
      const insufficient = [];
      for (const ingredient of product.ingredients) {
        const stockItem = this.stock.find((s) => s.id === ingredient.stockId);
        const needed = ingredient.quantity * quantity;
        if (!stockItem || stockItem.quantity < needed) {
          insufficient.push(this.getStockName(ingredient.stockId));
        }
      }

      if (insufficient.length > 0) {
        alert(`Estoque insuficiente para: ${insufficient.join(", ")}`);
        return;
      }

      try {
        // Atualizar estoque no Firebase
        for (const ingredient of product.ingredients) {
          const stockItem = this.stock.find((s) => s.id === ingredient.stockId);
          if (stockItem) {
            const newQuantity =
              stockItem.quantity - ingredient.quantity * quantity;
            await db.collection("stock").doc(stockItem.id).update({
              quantity: newQuantity,
            });
          }
        }

        this.productionForm = { productId: "", quantity: 1 };
        alert(
          `${quantity} unidade(s) de ${product.name} produzida(s) com sucesso!`
        );
      } catch (error) {
        console.error("Erro na produção:", error);
        alert("Erro ao produzir. Tente novamente.");
      }
    },

    // Financeiro
    async recordSale() {
      try {
        const product = this.products.find(
          (p) => p.id === this.saleForm.productId
        );
        if (!product) return;

        const quantity = parseInt(this.saleForm.quantity);
        const total = product.price * quantity;

        // Verificar e atualizar estoque
        for (let ing of product.ingredients) {
          const stockItem = this.stock.find((s) => s.id === ing.stockId);
          if (!stockItem) continue;

          const requiredQty = ing.quantity * quantity;

          if (stockItem.quantity < requiredQty) {
            alert(`Estoque insuficiente para ${stockItem.name}`);
            return;
          }

          await db
            .collection("stock")
            .doc(stockItem.id)
            .update({
              quantity: stockItem.quantity - requiredQty,
            });
        }

        // Registrar a venda no Firestore
        await db.collection("sales").add({
          productId: product.id,
          productName: product.name,
          quantity: quantity,
          unitPrice: product.price,
          total: total,
          customer: this.saleForm.customer || "Cliente não informado",
          date: new Date(),
        });

        this.saleForm = { productId: "", quantity: 1, customer: "" };
        alert("Venda registrada e estoque atualizado!");
      } catch (error) {
        console.error("Erro ao registrar venda:", error);
        alert("Erro ao registrar venda. Tente novamente.");
      }
    },

    async recordExpense() {
      try {
        await db.collection("expenses").add({
          description: this.expenseForm.description,
          amount: parseFloat(this.expenseForm.amount),
          category: this.expenseForm.category,
          date: new Date(),
        });
        this.expenseForm = { description: "", amount: 0, category: "" };
        alert("Despesa registrada com sucesso!");
      } catch (error) {
        console.error("Erro ao registrar despesa:", error);
        alert("Erro ao registrar despesa. Tente novamente.");
      }
    },

    // Relatórios
    generateReport() {
      try {
        let startDate, endDate;

        if (this.reportFilters.month) {
          const [year, month] = this.reportFilters.month.split("-");
          startDate = new Date(year, month - 1, 1);
          endDate = new Date(year, month, 0);
        } else {
          startDate = new Date(this.reportFilters.year, 0, 1);
          endDate = new Date(this.reportFilters.year, 11, 31);
        }

        // Filtrar vendas do período
        const periodSales = this.sales.filter((sale) => {
          const saleDate = sale.date?.toDate
            ? sale.date.toDate()
            : new Date(sale.date);
          return saleDate >= startDate && saleDate <= endDate;
        });

        // Filtrar despesas do período
        const periodExpenses = this.expenses.filter((expense) => {
          const expenseDate = expense.date?.toDate
            ? expense.date.toDate()
            : new Date(expense.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        });

        // Calcular estatísticas
        const totalSales = periodSales.reduce(
          (sum, sale) => sum + sale.quantity,
          0
        );
        const revenue = periodSales.reduce((sum, sale) => sum + sale.total, 0);
        const expenses = periodExpenses.reduce(
          (sum, expense) => sum + expense.amount,
          0
        );

        // Produtos mais vendidos
        const productSales = {};
        periodSales.forEach((sale) => {
          if (!productSales[sale.productName]) {
            productSales[sale.productName] = { quantity: 0, revenue: 0 };
          }
          productSales[sale.productName].quantity += sale.quantity;
          productSales[sale.productName].revenue += sale.total;
        });

        const topProducts = Object.entries(productSales)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.quantity - a.quantity);

        // Despesas por categoria
        const categoryExpenses = {};
        periodExpenses.forEach((expense) => {
          if (!categoryExpenses[expense.category]) {
            categoryExpenses[expense.category] = 0;
          }
          categoryExpenses[expense.category] += expense.amount;
        });

        const expensesByCategory = Object.entries(categoryExpenses)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount);

        this.report = {
          totalSales,
          revenue,
          expenses,
          topProducts,
          expensesByCategory,
          period: this.reportFilters.month || this.reportFilters.year,
        };
      } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        alert("Erro ao gerar relatório. Tente novamente.");
      }
    },

    exportToPDF() {
      if (!this.report) return;

      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Título
        doc.setFontSize(20);
        doc.text("Refúgio das Flores - Relatório Mensal", 20, 20);

        doc.setFontSize(12);
        doc.text(`Período: ${this.report.period}`, 20, 35);

        // Resumo financeiro
        doc.setFontSize(16);
        doc.text("Resumo Financeiro", 20, 55);

        doc.setFontSize(12);
        doc.text(`Produtos vendidos: ${this.report.totalSales}`, 20, 70);
        doc.text(`Receita: R$ ${this.report.revenue.toFixed(2)}`, 20, 80);
        doc.text(`Despesas: R$ ${this.report.expenses.toFixed(2)}`, 20, 90);
        doc.text(
          `Lucro: R$ ${(this.report.revenue - this.report.expenses).toFixed(
            2
          )}`,
          20,
          100
        );

        // Produtos mais vendidos
        doc.setFontSize(16);
        doc.text("Produtos Mais Vendidos", 20, 125);

        let y = 140;
        doc.setFontSize(12);
        this.report.topProducts.forEach((product) => {
          doc.text(
            `${product.name}: ${
              product.quantity
            } unidades - R$ ${product.revenue.toFixed(2)}`,
            20,
            y
          );
          y += 10;
        });

        doc.save(`relatorio-${this.report.period}.pdf`);
      } catch (error) {
        console.error("Erro ao exportar PDF:", error);
        alert("Erro ao exportar PDF. Verifique se o jsPDF está carregado.");
      }
    },

    // Utilitários
    getStockName(stockId) {
      const item = this.stock.find((s) => s.id === stockId);
      return item ? item.name : "Item não encontrado";
    },

    getStockQuantity(stockId) {
      const item = this.stock.find((s) => s.id === stockId);
      return item ? item.quantity : 0;
    },

    getProductIngredients(productId) {
      const product = this.products.find((p) => p.id === productId);
      return product ? product.ingredients : [];
    },

    // Computed properties
    get filteredStock() {
      // filtra pelo texto da busca
      let filtered = this.stock.filter((item) =>
        item.name?.toLowerCase().includes(this.stockSearch.toLowerCase())
      );

      // ordena alfabeticamente conforme stockOrder
      filtered.sort((a, b) => {
        if (this.stockOrder === "asc") return a.name.localeCompare(b.name);
        else return b.name.localeCompare(a.name);
      });

      return filtered;
    },

    get filteredProducts() {
      return this.products.filter((product) =>
        product.name.toLowerCase().includes(this.productSearch.toLowerCase())
      );
    },

    get totalRevenue() {
      return this.sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    },

    get totalExpenses() {
      return this.expenses.reduce(
        (sum, expense) => sum + (expense.amount || 0),
        0
      );
    },

    get recentTransactions() {
      const transactions = [
        ...this.sales.map((sale) => ({
          ...sale,
          type: "sale",
          description: `${sale.quantity}x ${sale.productName}`,
          amount: sale.total,
          date: sale.date?.toDate ? sale.date.toDate() : new Date(sale.date),
        })),
        ...this.expenses.map((expense) => ({
          ...expense,
          type: "expense",
          date: expense.date?.toDate
            ? expense.date.toDate()
            : new Date(expense.date),
        })),
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

      return transactions;
    },

    // Função para forçar atualização
    async forceRefresh() {
      console.log("Forçando atualização dos dados...");
      try {
        // Recarregar estoque
        const stockSnapshot = await db.collection("stock").get();
        this.stock = stockSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Recarregar produtos
        const productsSnapshot = await db.collection("products").get();
        this.products = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Recarregar vendas
        const salesSnapshot = await db.collection("sales").get();
        this.sales = salesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Recarregar despesas
        const expensesSnapshot = await db.collection("expenses").get();
        this.expenses = expensesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Dados atualizados:", {
          stock: this.stock.length,
          products: this.products.length,
          sales: this.sales.length,
          expenses: this.expenses.length,
        });

        alert("Dados atualizados com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar dados:", error);
        alert("Erro ao atualizar dados. Tente novamente.");
      }
    },
  };
}
