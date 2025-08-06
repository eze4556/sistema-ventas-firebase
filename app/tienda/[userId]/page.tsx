"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { ref, get } from "firebase/database"
import { database } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Share2, ShoppingCart, Image, Phone, MapPin, Clock, Instagram, Facebook, Share } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { useClient } from "@/hooks/use-client"
import { ClientOnly } from "@/components/client-only"

interface Producto {
  id?: string
  nombre: string
  descripcion: string
  precio: number
  stock: number
  categoria: string
  imagen: string
  destacado: boolean
  activo: boolean
}

interface TiendaConfig {
  nombre: string
  descripcion: string
  telefono: string
  whatsapp: string
  direccion: string
  horarios: string
  logo: string
  redesSociales: {
    instagram?: string
    facebook?: string
  }
}

export default function TiendaPublica({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  
  const [productos, setProductos] = useState<Record<string, Producto>>({})
  const [tiendaConfig, setTiendaConfig] = useState<TiendaConfig>({
    nombre: "Mi Tienda",
    descripcion: "Los mejores productos al mejor precio",
    telefono: "",
    whatsapp: "",
    direccion: "",
    horarios: "",
    logo: "",
    redesSociales: {}
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategoria, setFilterCategoria] = useState("todas")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 12

  const isClient = useClient()

  useEffect(() => {
    const cargarTienda = async () => {
      try {
        // Cargar configuración de la tienda
        const configRef = ref(database, `tiendas/${userId}/config`)
        const configSnapshot = await get(configRef)
        if (configSnapshot.exists()) {
          setTiendaConfig(configSnapshot.val())
        }

        // Cargar productos
        const productosRef = ref(database, `tiendas/${userId}/productos`)
        const productosSnapshot = await get(productosRef)
        if (productosSnapshot.exists()) {
          setProductos(productosSnapshot.val())
        }
      } catch (error) {
        console.error("Error al cargar la tienda:", error)
      } finally {
        setLoading(false)
      }
    }

    cargarTienda()
  }, [userId])

  // Filtrar productos
  const productosFiltrados = Object.entries(productos || {})
    .filter(([id, producto]) => {
      const matchesSearch = producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategoria = filterCategoria === "todas" || producto.categoria === filterCategoria
      const isActive = producto.activo && producto.stock > 0
      
      return matchesSearch && matchesCategoria && isActive
    })
    .map(([id, producto]) => ({ id, ...producto }))

  // Paginación
  const totalPages = Math.ceil(productosFiltrados.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const productosPaginados = productosFiltrados.slice(startIndex, startIndex + itemsPerPage)

  const categorias = [...new Set(Object.values(productos || {}).map(p => p.categoria).filter(Boolean))]

  const generateWhatsAppMessage = (producto: Producto) => {
    const mensaje = `¡Hola! Quiero comprar:\n\n` +
      `*${producto.nombre}*\n` +
      `${producto.descripcion}\n\n` +
      `💰 Precio: $${producto.precio}\n` +
      `📦 Stock disponible: ${producto.stock} unidades\n\n` +
      `¿Tienes stock disponible?`
    
    return encodeURIComponent(mensaje)
  }

  const shareTienda = () => {
    const mensaje = `¡Hola! Te comparto el catálogo de ${tiendaConfig.nombre}:\n\n` +
      `${tiendaConfig.descripcion}\n\n` +
      `🛍️ Ver productos: ${window.location.href}\n\n` +
      `📞 Contacto: ${tiendaConfig.whatsapp || tiendaConfig.telefono}`
    
    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
    window.open(whatsappURL, '_blank')
  }

  const limpiarFiltros = () => {
    setSearchTerm("")
    setFilterCategoria("todas")
    setCurrentPage(1)
  }

  const recargarProductos = async () => {
    setLoading(true)
    try {
      // Cargar productos
      const productosRef = ref(database, `tiendas/${userId}/productos`)
      const productosSnapshot = await get(productosRef)
      if (productosSnapshot.exists()) {
        setProductos(productosSnapshot.val())
      } else {
        setProductos({})
      }
    } catch (error) {
      console.error("Error al recargar productos:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando catálogo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header de la Tienda */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {tiendaConfig.logo ? (
                <img 
                  src={tiendaConfig.logo} 
                  alt={tiendaConfig.nombre}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{tiendaConfig.nombre}</h1>
                <p className="text-gray-600">{tiendaConfig.descripcion}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ClientOnly
                fallback={
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    disabled
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir Tienda
                  </Button>
                }
              >
                <Button 
                  onClick={shareTienda} 
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir Tienda
                </Button>
              </ClientOnly>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            {tiendaConfig.telefono && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{tiendaConfig.telefono}</span>
              </div>
            )}
            {tiendaConfig.whatsapp && (
              <div className="flex items-center gap-2 text-gray-600">
                <ShoppingCart className="h-4 w-4" />
                <span>WhatsApp: {tiendaConfig.whatsapp}</span>
              </div>
            )}
            {tiendaConfig.direccion && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{tiendaConfig.direccion}</span>
              </div>
            )}
            {tiendaConfig.horarios && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{tiendaConfig.horarios}</span>
              </div>
            )}
          </div>

          {/* Redes sociales */}
          {(tiendaConfig.redesSociales?.instagram || tiendaConfig.redesSociales?.facebook) && (
            <div className="mt-4 flex items-center gap-4">
              {tiendaConfig.redesSociales?.instagram && (
                <a 
                  href={`https://instagram.com/${tiendaConfig.redesSociales.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-pink-600 hover:text-pink-700"
                >
                  <Instagram className="h-4 w-4" />
                  <span>@{tiendaConfig.redesSociales.instagram}</span>
                </a>
              )}
              {tiendaConfig.redesSociales?.facebook && (
                <a 
                  href={`https://facebook.com/${tiendaConfig.redesSociales.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Facebook className="h-4 w-4" />
                  <span>{tiendaConfig.redesSociales.facebook}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controles de búsqueda y filtros */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || (filterCategoria && filterCategoria !== "todas")) && (
              <Button variant="outline" onClick={limpiarFiltros} size="sm">
                Limpiar
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-600">
            {productosFiltrados.length} productos encontrados
          </div>
        </div>

        {/* Grid de Productos */}
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
            <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productosPaginados.map((producto) => (
                <Card key={producto.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {producto.imagen ? (
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <Image className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {producto.destacado && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500">
                        Destacado
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg truncate">{producto.nombre}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {producto.descripcion}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          ${producto.precio}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Stock: {producto.stock}
                        </span>
                      </div>

                      {producto.categoria && (
                        <Badge variant="outline" className="text-xs">
                          {producto.categoria}
                        </Badge>
                      )}
                    </div>

                    {/* Botón Comprar por WhatsApp */}
                    <ClientOnly
                      fallback={
                        <Button
                          className="w-full mt-4 bg-green-600 hover:bg-green-700"
                          disabled
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Comprar por WhatsApp
                        </Button>
                      }
                    >
                      <Button
                        className="w-full mt-4 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          const mensaje = generateWhatsAppMessage(producto)
                          const whatsappURL = `https://wa.me/${tiendaConfig.whatsapp}?text=${mensaje}`
                          window.open(whatsappURL, '_blank')
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Comprar por WhatsApp
                      </Button>
                    </ClientOnly>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination>
                  <Pagination.Prev
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Item>{currentPage} de {totalPages}</Pagination.Item>
                  <Pagination.Next
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>© 2024 {tiendaConfig.nombre}. Todos los derechos reservados.</p>
          <p className="text-sm mt-2">Catálogo generado automáticamente</p>
        </div>
      </div>
    </div>
  )
} 