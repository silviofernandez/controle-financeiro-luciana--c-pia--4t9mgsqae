import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  PieChart,
  Settings,
  Calculator,
  Activity,
  Receipt,
  TrendingUp,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const items = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Inserir Dados', url: '/inserir', icon: PlusCircle },
  { title: 'Resultado da Empresa', url: '/resultado-empresa', icon: TrendingUp },
  { title: 'Calculadora de Comissão', url: '/comissoes', icon: Calculator },
  { title: 'Margem de Contribuição', url: '/margem-contribuicao', icon: Activity },
  { title: 'Custos Operacionais', url: '/custos-operacionais', icon: Receipt },
  { title: 'Relatórios', url: '/relatorios', icon: PieChart },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6 md:hidden">
            <h2 className="text-xl font-bold text-primary">Luciana</h2>
          </div>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={
                        isActive
                          ? 'bg-primary/10 text-primary border-l-4 border-primary rounded-none shadow-none hover:bg-primary/15'
                          : 'border-l-4 border-transparent rounded-none'
                      }
                    >
                      <Link to={item.url}>
                        <item.icon className={isActive ? 'text-primary' : ''} />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
