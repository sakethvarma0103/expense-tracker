import { Avatar, type SvgIconProps } from '@mui/material'
import AccountBalance from '@mui/icons-material/AccountBalance'
import Bolt from '@mui/icons-material/Bolt'
import Build from '@mui/icons-material/Build'
import CardGiftcard from '@mui/icons-material/CardGiftcard'
import CategoryOutlined from '@mui/icons-material/Category'
import Checkroom from '@mui/icons-material/Checkroom'
import ChildCare from '@mui/icons-material/ChildCare'
import DirectionsBus from '@mui/icons-material/DirectionsBus'
import FitnessCenter from '@mui/icons-material/FitnessCenter'
import Flight from '@mui/icons-material/Flight'
import Home from '@mui/icons-material/Home'
import Label from '@mui/icons-material/Label'
import LocalBar from '@mui/icons-material/LocalBar'
import LocalCafe from '@mui/icons-material/LocalCafe'
import LocalGasStation from '@mui/icons-material/LocalGasStation'
import LocalHospital from '@mui/icons-material/LocalHospital'
import Movie from '@mui/icons-material/Movie'
import Pets from '@mui/icons-material/Pets'
import PhoneAndroid from '@mui/icons-material/PhoneAndroid'
import Replay from '@mui/icons-material/Replay'
import Restaurant from '@mui/icons-material/Restaurant'
import Savings from '@mui/icons-material/Savings'
import School from '@mui/icons-material/School'
import ShoppingBag from '@mui/icons-material/ShoppingBag'
import ShoppingCart from '@mui/icons-material/ShoppingCart'
import Spa from '@mui/icons-material/Spa'
import SportsEsports from '@mui/icons-material/SportsEsports'
import Storefront from '@mui/icons-material/Storefront'
import TrendingUp from '@mui/icons-material/TrendingUp'
import VolunteerActivism from '@mui/icons-material/VolunteerActivism'
import Wifi from '@mui/icons-material/Wifi'
import Work from '@mui/icons-material/Work'
import type { CategoryIconName } from '../types/category'

const ICONS = {
  restaurant: Restaurant,
  local_cafe: LocalCafe,
  local_bar: LocalBar,
  shopping_cart: ShoppingCart,
  shopping_bag: ShoppingBag,
  checkroom: Checkroom,
  directions_bus: DirectionsBus,
  local_gas_station: LocalGasStation,
  flight: Flight,
  home: Home,
  bolt: Bolt,
  wifi: Wifi,
  phone_android: PhoneAndroid,
  build: Build,
  local_hospital: LocalHospital,
  fitness_center: FitnessCenter,
  spa: Spa,
  school: School,
  child_care: ChildCare,
  pets: Pets,
  movie: Movie,
  sports_esports: SportsEsports,
  card_giftcard: CardGiftcard,
  volunteer_activism: VolunteerActivism,
  account_balance: AccountBalance,
  work: Work,
  storefront: Storefront,
  savings: Savings,
  trending_up: TrendingUp,
  replay: Replay,
  label: Label,
  category: CategoryOutlined,
} satisfies Record<CategoryIconName, unknown>

export function CategoryIcon({ name, ...props }: { name: CategoryIconName } & SvgIconProps) {
  const Icon = ICONS[name]
  return <Icon {...props} />
}

interface CategoryAvatarProps {
  icon: CategoryIconName
  color: string
  size?: number
}

/** Coloured circle with a white category icon */
export function CategoryAvatar({ icon, color, size = 40 }: CategoryAvatarProps) {
  return (
    <Avatar sx={{ bgcolor: color, color: '#fff', width: size, height: size }}>
      <CategoryIcon name={icon} sx={{ fontSize: size * 0.55 }} />
    </Avatar>
  )
}
