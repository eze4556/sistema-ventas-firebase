"use client"

import { useState, useEffect, useMemo } from "react"
import { ref, onValue } from "firebase/database"
import { database } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LogOut, Package, Users, ShoppingCart, AlertTriangle, Menu, ChevronDown, ChevronUp, Building, FileText, Store } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import ProductosTab from "@/components/productos-tab"
import ProveedoresTab from "@/components/proveedores-tab"
import VentasTab from "@/components/ventas-tab"
import StockTab from "@/components/stock-tab"
import ReportesTab from "@/components/reportes-tab"
import CustomReports from "@/components/custom-reports"
import FacturacionTab from "@/components/facturacion-tab"
import TiendaTab from "@/components/tienda-tab"
import { useOptimizedRealtimeData } from "@/hooks/useOptimizedQueries"

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("productos")
  const [triggerNewSale, setTriggerNewSale] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [stockAlertsMinimized, setStockAlertsMinimized] = useState(false)
  const [empresaInfo, setEmpresaInfo] = useState(null)

  // Usar consultas optimizadas
  const { data: productos, loading: productosLoading } = useOptimizedRealtimeData("productos")
  const { data: proveedores, loading: proveedoresLoading } = useOptimizedRealtimeData("proveedores")
  const { data: ventas, loading: ventasLoading } = useOptimizedRealtimeData("ventas")

  // Cargar información de la empresa si el usuario tiene una
  useEffect(() => {
    if (user?.empresa) {
      const empresaRef = ref(database, `empresas/${user.empresa}`)
      const unsubscribeEmpresa = onValue(empresaRef, (snapshot) => {
        setEmpresaInfo(snapshot.val())
      })
      return () => unsubscribeEmpresa()
    }
  }, [user])

  // Escuchar teclas de función
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "F1") {
        event.preventDefault()
        setActiveTab("ventas")
        setTriggerNewSale(true)
        setTimeout(() => setTriggerNewSale(false), 100)
      } else if (event.key === "F2") {
        event.preventDefault()
        setActiveTab("proveedores")
      } else if (event.key === "F3") {
        event.preventDefault()
        setActiveTab("productos")
      } else if (event.key === "F7") {
        event.preventDefault()
        setActiveTab("reportes")
      } else if (event.key === "F8") {
        event.preventDefault()
        setActiveTab("facturacion")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Cálculos optimizados con useMemo
  const { totalProductos, totalProveedores, totalVentas, stockBajo } = useMemo(() => {
    const productosArray = Object.entries(productos || {}).map(([id, producto]) => ({
      id,
      ...producto,
    }))
    
    const stockBajoItems = productosArray.filter((p) => p.stock <= p.stockMinimo)
    
    return {
      totalProductos: Object.keys(productos || {}).length,
      totalProveedores: Object.keys(proveedores || {}).length,
      totalVentas: Object.values(ventas || {}).reduce((sum, venta) => sum + (venta.total || 0), 0),
      stockBajo: stockBajoItems
    }
  }, [productos, proveedores, ventas])

  const TabsNavigation = ({ isMobile = false }) => (
    <TabsList className={`${isMobile ? "grid grid-cols-2 gap-1 h-auto" : "grid w-full grid-cols-8"}`}>
      <TabsTrigger
        value="productos"
        className={`${isMobile ? "text-xs p-2" : ""}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <span className={`${isMobile ? "block" : "hidden sm:inline"}`}>Productos</span>
        <span className={`${isMobile ? "hidden" : "sm:hidden"}`}>F3</span>
      </TabsTrigger>
      <TabsTrigger
        value="proveedores"
        className={`${isMobile ? "text-xs p-2" : ""}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <span className={`${isMobile ? "block" : "hidden sm:inline"}`}>Proveedores</span>
        <span className={`${isMobile ? "hidden" : "sm:hidden"}`}>F2</span>
      </TabsTrigger>
      <TabsTrigger
        value="ventas"
        className={`${isMobile ? "text-xs p-2" : ""}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <span className={`${isMobile ? "block" : "hidden sm:inline"}`}>Ventas</span>
        <span className={`${isMobile ? "hidden" : "sm:hidden"}`}>F1</span>
      </TabsTrigger>
      <TabsTrigger
        value="tienda"
        className={`${isMobile ? "text-xs p-2" : ""}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <Store className="h-4 w-4 mr-1" />
        <span className={`${isMobile ? "block" : "hidden sm:inline"}`}>Mi Tienda</span>
      </TabsTrigger>
      <TabsTrigger
        value="stock"
        className={`${isMobile ? "block" : ""}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <span className={`${isMobile ? "block" : "hidden sm:inline"}`}>Stock</span>
      </TabsTrigger>
      <TabsTrigger
        value="reportes"
        className={`${isMobile ? "text-xs p-2" : ""}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <span className={`${isMobile ? "block" : "hidden sm:inline"}`}>Reportes</span>
        <span className={`${isMobile ? "hidden" : "sm:hidden"}`}>F7</span>
      </TabsTrigger>
      <TabsTrigger
        value="personalizados"
        className={`${isMobile ? "text-xs p-2" : ""}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <span className={`${isMobile ? "block" : "hidden sm:inline"}`}>Personalizados</span>
      </TabsTrigger>
      <TabsTrigger
        value="facturacion"
        className={`${isMobile ? "text-xs p-2" : ""}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <span className={`${isMobile ? "block" : "hidden sm:inline"}`}>Facturación</span>
        <span className={`${isMobile ? "hidden" : "sm:hidden"}`}>F8</span>
      </TabsTrigger>
    </TabsList>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">ControlStock</h1>
              {empresaInfo && (
                <div className="hidden sm:flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{empresaInfo.nombre}</span>
                  <Badge variant="outline" className="text-xs">
                    {empresaInfo.plan}
                  </Badge>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  F1 = Venta
                </Badge>
                <Badge variant="outline" className="text-xs">
                  F2 = Proveedores
                </Badge>
                <Badge variant="outline" className="text-xs">
                  F3 = Productos
                </Badge>
                <Badge variant="outline" className="text-xs">
                  F7 = Reportes
                </Badge>
                <Badge variant="outline" className="text-xs">
                  F8 = Facturación
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground hidden xl:block">
                Bienvenido, {user?.name || user?.email}
              </span>
              <ThemeToggle />
              <Button variant="outline" onClick={onLogout} size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden flex items-center space-x-2">
              <ThemeToggle />
              <Button variant="outline" onClick={onLogout} size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h2 className="text-lg font-semibold">Navegación</h2>
                      <p className="text-sm text-muted-foreground">{user?.name || user?.email}</p>
                      {empresaInfo && (
                        <div className="mt-2 flex items-center justify-center space-x-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{empresaInfo.nombre}</span>
                        </div>
                      )}
                    </div>
                    <TabsNavigation isMobile={true} />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Atajos de Teclado:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <Badge variant="outline">F1 = Nueva Venta</Badge>
                        <Badge variant="outline">F2 = Proveedores</Badge>
                        <Badge variant="outline">F3 = Productos</Badge>
                        <Badge variant="outline">F7 = Reportes</Badge>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Alertas de Stock Bajo con opción de minimizar/maximizar */}
        {stockBajo.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-red-800 dark:text-red-200 flex items-center text-sm sm:text-base">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Alertas de Stock Bajo ({stockBajo.length})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStockAlertsMinimized(!stockAlertsMinimized)}
                    className="h-8 w-8 p-0"
                  >
                    {stockAlertsMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {!stockAlertsMinimized && (
                <CardContent>
                  <div className="space-y-2">
                    {stockBajo.slice(0, 3).map((producto) => (
                      <div
                        key={producto.id}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
                      >
                        <span className="font-medium text-sm">{producto.nombre}</span>
                        <Badge variant="destructive" className="text-xs w-fit">
                          Stock: {producto.stock} (Mín: {producto.stockMinimo})
                        </Badge>
                      </div>
                    ))}
                    {stockBajo.length > 3 && (
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Y {stockBajo.length - 3} productos más...
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Productos</CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{totalProductos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Proveedores</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{totalProveedores}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Ventas Totales</CardTitle>
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">${totalVentas.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Stock Bajo</CardTitle>
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{stockBajo.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Desktop Tabs */}
          <div className="hidden lg:block">
            <TabsNavigation />
          </div>

          {/* Mobile Tabs - Simplified */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold capitalize">{activeTab}</h2>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-4 w-4 mr-2" />
                    Cambiar Sección
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Seleccionar Sección</h2>
                    <TabsNavigation isMobile={true} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <TabsContent value="productos">
            <ProductosTab productos={productos} proveedores={proveedores} />
          </TabsContent>

          <TabsContent value="proveedores">
            <ProveedoresTab proveedores={proveedores} productos={productos} />
          </TabsContent>

          <TabsContent value="ventas">
            <VentasTab
              productos={productos}
              ventas={ventas}
              proveedores={proveedores}
              triggerNewSale={triggerNewSale}
            />
          </TabsContent>

                  <TabsContent value="tienda">
          <TiendaTab productos={productos} user={user} />
        </TabsContent>

          <TabsContent value="stock">
            <StockTab productos={productos} stockBajo={stockBajo} />
          </TabsContent>

          <TabsContent value="reportes">
            <ReportesTab ventas={ventas} productos={productos} proveedores={proveedores} />
          </TabsContent>

          <TabsContent value="personalizados">
            <CustomReports ventas={ventas} productos={productos} proveedores={proveedores} />
          </TabsContent>

          <TabsContent value="facturacion">
            <FacturacionTab ventas={ventas} productos={productos} proveedores={proveedores} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
