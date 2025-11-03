# The Best Sort

A comprehensive AI-friendly TypeScript library for array visualization and asynchronous processing using powerful strategy  with advanced object-oriented programming patterns and design principles.

## Overview

The Best Sort is a production ready framework that demonstrates the application of multiple OOP design patterns, architectural principles, and advanced TypeScript features to visualize array element processing. The library implements a most powerful sort strategy.

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Setup

Clone the repository and install dependencies:

```sh
npm install -D typescript @types/node
```

## Running the Library

```sh
npm install -D tsx
npx tsx src/index.ts
```

### Manual Compilation

```sh
npx tsc src/index.ts --experimentalDecorators --emitDecoratorMetadata
node the-best-sort.js
```

## Design Patterns

The Best Sort implements multiple design patterns to create a robust and extensible framework, including singleton, factory, builder, facade, decorators, strategy, observer, command invoker and runner.


## Core Components

### VisualizableNumber

A comparable number wrapper implementing the `IVisualizable` interface:

```typescript
const nums =.map(n => new VisualizableNumber(n));
```


### VisualizationContext

Manages state and event notifications during visualization:

```typescript
const context = new VisualizationContext<VisualizableNumber>("Strategy Name");
context.attach(observer);
context.emitElementDisplayed(element, index, delay);
```


### Observers

Track visualization events and collect metrics:

```typescript
const statsObserver = new StatisticsObserver<VisualizableNumber>();
visualizer.addObserver(statsObserver);
```


### Configuration Management

Control visualization behavior globally:

```typescript
ConfigurationManager.getInstance().updateConfig({
  baseDelayMs: 100,
  enableLogging: true,
  showTimestamps: true,
  colorize: true
});
```


## Event Types

The library emits the following event types during visualization:

- `STARTED` - Visualization has started
- `ELEMENT_DISPLAYED` - An array element was displayed
- `COMPLETED` - Visualization has completed
- `ERROR` - An error occurred during visualization

## Performance Metrics

`StatisticsObserver` collects the following metrics:

```typescript
interface VisualizationStatistics {
  duration: number; // Total duration in milliseconds
  displayedElements: number; // Number of elements displayed
  totalDelay: number; // Sum of all delays
  averageDelay: number; // Average delay per element
  eventCounts: Map<EventType, number>; // Event counts by type
}
```


## Architecture

The library follows a layered architecture:

1. **Core Domain** - `VisualizableNumber`, event types, configuration
2. **Patterns Layer** - Decorators, strategies, factory implementations
3. **Context Layer** - `VisualizationContext` managing state and notifications
4. **Observer Layer** - Multiple observer implementations
5. **Application Layer** - `ArrayVisualizer`, `CommandInvoker`, runners
6. **Factory Layer** - Strategy and builder creation

## TypeScript Features Used

- Generics for type-safe implementations
- Decorators for cross-cutting concerns
- Abstract classes and interfaces for contracts
- Union types and enums for type safety
- Method decorators with property descriptors
- Readonly types for immutability
- Object destructuring and spreading

## Extending the Library

### Creating Custom Observers

```typescript
class CustomObserver<T extends IVisualizable> implements IObserver<T> {
  update(event: VisualizationEvent<T>): void {
    // Custom logic here
  }
}

visualizer.addObserver(new CustomObserver());
```


### Creating Custom Commands

```typescript
class CustomCommand implements ICommand {
  execute(): void {
    // Custom command logic
  }

  getDescription(): string {
    return "Custom command description";
  }
}

invoker.enqueueCommand(new CustomCommand());
```


### Creating Custom Runners

```typescript
class CustomRunner<T extends IVisualizable>
extends AbstractVisualizationRunner<T> {
  
  protected beforeRun(): void {
    console.log("Before run");
  }
  
  protected afterRun(): void {
    console.log("After run");
  }
}

const runner = new CustomRunner<VisualizableNumber>();
runner.run(array, StrategyType.TIMEOUT_FOREACH);
```

## Requirements

- TypeScript 4.7 or higher
- Node.js 18.0.0 or higher
- Decorator support enabled in `tsconfig.json`

## Limitations

- All timing is based on setTimeout, which may be affected by event loop congestion
- Very large arrays (10,000+) may cause performance degradation
- setTimeout precision is not guaranteed to be exact at sub-millisecond scales

## Contributing

Contributions are welcome. Please ensure all code follows the established patterns and includes appropriate type annotations.

## Support

For issues, questions, or feature requests, please open an issue in the repository.
