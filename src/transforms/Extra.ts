import { Archive } from '../Archive';
import { Entity } from '../types';
import transformPowerLine from './extras/PowerLine';
import transformCircuitSubsystem from './extras/CircuitSubsystem';
import transformGameMode from './extras/GameMode';
import transformGameState from './extras/GameState';
import transformPlayerState from './extras/PlayerState';
import transformVehicle from './extras/Vehicle';
import transformConveyorBelt from './extras/ConveyorBelt';
import transformRailroadSubsystem from './extras/RailroadSubsystem';
import transformTrain from './extras/Train';

export default function transformExtra(
    ar: Archive,
    entity: Entity, className: string,
    length: number) {
    switch (className) {
        case '/Game/FactoryGame/Buildable/Factory/PowerLine/Build_PowerLine.Build_PowerLine_C':
            transformPowerLine(ar, entity);
            break;
        case '/Game/FactoryGame/-Shared/Blueprint/BP_CircuitSubsystem.BP_CircuitSubsystem_C':
            transformCircuitSubsystem(ar, entity);
            break;
        case '/Game/FactoryGame/-Shared/Blueprint/BP_GameMode.BP_GameMode_C':
            transformGameMode(ar, entity);
            break;
        case '/Game/FactoryGame/-Shared/Blueprint/BP_GameState.BP_GameState_C':
            transformGameState(ar, entity);
            break;
        case '/Game/FactoryGame/-Shared/Blueprint/BP_RailroadSubsystem.BP_RailroadSubsystem_C':
            transformRailroadSubsystem(ar, entity, length);
            break;
        case '/Game/FactoryGame/Character/Player/BP_PlayerState.BP_PlayerState_C':
            transformPlayerState(ar, entity, length);
            break;
        case '/Game/FactoryGame/Buildable/Vehicle/Tractor/BP_Tractor.BP_Tractor_C':
        case '/Game/FactoryGame/Buildable/Vehicle/Truck/BP_Truck.BP_Truck_C':
        case '/Game/FactoryGame/Buildable/Vehicle/Explorer/BP_Explorer.BP_Explorer_C':
            transformVehicle(ar, entity);
            break;
        // tslint:disable: max-line-length
        case '/Game/FactoryGame/Buildable/Factory/ConveyorBeltMk1/Build_ConveyorBeltMk1.Build_ConveyorBeltMk1_C':
        case '/Game/FactoryGame/Buildable/Factory/ConveyorBeltMk2/Build_ConveyorBeltMk2.Build_ConveyorBeltMk2_C':
        case '/Game/FactoryGame/Buildable/Factory/ConveyorBeltMk3/Build_ConveyorBeltMk3.Build_ConveyorBeltMk3_C':
        case '/Game/FactoryGame/Buildable/Factory/ConveyorBeltMk4/Build_ConveyorBeltMk4.Build_ConveyorBeltMk4_C':
        case '/Game/FactoryGame/Buildable/Factory/ConveyorBeltMk5/Build_ConveyorBeltMk5.Build_ConveyorBeltMk5_C':
        case '/Game/FactoryGame/Buildable/Factory/ConveyorBeltMk6/Build_ConveyorBeltMk6.Build_ConveyorBeltMk6_C':
        case '/Game/FactoryGame/Buildable/Factory/ConveyorLiftMk1/Build_ConveyorLiftMk1.Build_ConveyorLiftMk1_C':
        case '/Game/FactoryGame/Buildable/Factory/ConveyorLiftMk2/Build_ConveyorLiftMk2.Build_ConveyorLiftMk2_C':
        case '/Game/FactoryGame/Buildable/Factory/ConveyorLiftMk3/Build_ConveyorLiftMk3.Build_ConveyorLiftMk3_C':
        case '/Game/FactoryGame/Buildable/Factory/ConveyorLiftMk4/Build_ConveyorLiftMk4.Build_ConveyorLiftMk4_C':
        case '/Game/FactoryGame/Buildable/Factory/ConveyorLiftMk5/Build_ConveyorLiftMk5.Build_ConveyorLiftMk5_C':
        case '/Game/FactoryGame/Buildable/Factory/ConveyorLiftMk6/Build_ConveyorLiftMk6.Build_ConveyorLiftMk6_C':
        // Mk6_Mod
        case '/Game/FactoryGame/Mk6_Mod/Build_ConveyorLiftMk61.Build_ConveyorLiftMk61_C':
        case '/Game/FactoryGame/Mk6_Mod/Build_BeltMk61.Build_BeltMk61_C':
            // tslint:enable
            transformConveyorBelt(ar, entity, length);
            break;
        case '/Game/FactoryGame/Buildable/Vehicle/Train/Wagon/BP_FreightWagon.BP_FreightWagon_C':
        case '/Game/FactoryGame/Buildable/Vehicle/Train/Locomotive/BP_Locomotive.BP_Locomotive_C':
            transformTrain(ar, entity, length);
            break;

    }
}
