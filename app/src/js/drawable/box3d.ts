import _ from 'lodash'
import * as THREE from 'three'

import { addBox3dLabel } from '../action/box3d'
import { changeLabelShape } from '../action/common'
import Session from '../common/session'

import { getCurrentPointCloudViewerConfig } from '../functional/state_util'
import { makeLabel } from '../functional/states'
import {
  CubeType, PointCloudViewerConfigType, ShapeType, State
} from '../functional/types'

import { Vector3D } from '../math/vector3d'

import { LabelTypes } from '../common/types'
import { TransformationControl } from './control/transformation_control'
import { Cube3D } from './cube3d'
import { Label3D } from './label3d'
import { Plane3D } from './plane3d'

/**
 * Box3d Label
 */
export class Box3D extends Label3D {
  /** ThreeJS object for rendering shape */
  private _shape: Cube3D

  constructor () {
    super()
    this._shape = new Cube3D(this._index)
  }

  /**
   * Initialize label
   * @param {State} state
   */
  public init (state: State, surfaceId?: number, _temporary?: boolean): void {
    const itemIndex = state.user.select.item
    this._order = state.task.status.maxOrder + 1
    this._label = makeLabel({
      type: LabelTypes.BOX_3D, id: -1, item: itemIndex,
      category: [state.user.select.category],
      order: this._order
    })
    this._labelId = -1
    const viewerConfig: PointCloudViewerConfigType =
      getCurrentPointCloudViewerConfig(state)
    const center = (new Vector3D()).fromObject(viewerConfig.target)
    if (this._plane) {
      center.z = 0.5
    }
    this._shape.setCenter(center)
    Session.dispatch(addBox3dLabel(
      this._label.item, this._label.category,
      this._shape.getCenter(),
      this._shape.getSize(),
      this._shape.getOrientation(),
      surfaceId
    ))
  }

  /**
   * Override set selected
   * @param s
   */
  public setSelected (s: boolean) {
    super.setSelected(s)
  }

  /** Attach label to plane */
  public attachToPlane (plane: Plane3D) {
    super.attachToPlane(plane)
    this._shape.attachToPlane(plane)
    this.commitLabel()
  }

  /** Attach label to plane */
  public detachFromPlane () {
    super.detachFromPlane()
    this._shape.detachFromPlane()
  }

  /**
   * Attach control
   */
  public attachControl (control: TransformationControl) {
    this._shape.setControl(control, true)
  }

  /**
   * Attach control
   */
  public detachControl (control: TransformationControl) {
    this._shape.setControl(control, false)
  }

  /**
   * Return a list of the shape for inspection and testing
   */
  public shapes (): Array<Readonly<Cube3D>> {
    return [this._shape]
  }

  /**
   * Modify ThreeJS objects to draw label
   * @param {THREE.Scene} scene: ThreeJS Scene Object
   */
  public render (scene: THREE.Scene, camera: THREE.Camera): void {
    this._shape.render(scene, camera)
  }

  /**
   * Update Box3D internal parameters based on new state
   * @param state
   * @param itemIndex
   * @param labelId
   */
  public updateState (
    state: State, itemIndex: number, labelId: number): void {
    super.updateState(state, itemIndex, labelId)
    this._shape.setId(labelId)
  }

  /**
   * Expand the primitive shapes to drawable shapes
   * @param {ShapeType[]} shapes
   */
  public updateShapes (_shapes: ShapeType[]): void {
    const newShape = _shapes[0] as CubeType
    this._shape.setCenter((new Vector3D()).fromObject(newShape.center))
    this._shape.setSize((new Vector3D()).fromObject(newShape.size))
    this._shape.setOrientation(
      (new Vector3D()).fromObject(newShape.orientation)
    )
  }

  /**
   * move anchor to next corner
   */
  public incrementAnchorIndex (): void {
    this._shape.incrementAnchorIndex()
  }

  /** Update the shapes of the label to the state */
  public commitLabel (): void {
    if (this._label !== null) {
      const cube = this._shape.toCube()
      if (this._plane) {
        cube.center.z = 0.5 * cube.size.z
        cube.orientation.x = 0
        cube.orientation.y = 0
      }
      Session.dispatch(changeLabelShape(
        this._label.item, this._label.shapes[0], cube
      ))
    }
  }

  /**
   * Handle mouse move
   * @param projection
   */
  public onMouseDown () {
    return this._shape.shouldDrag()
  }

  /**
   * Handle mouse up
   * @param projection
   */
  public onMouseUp () {
    return
  }

  /**
   * Handle mouse move
   * @param projection
   */
  public onMouseMove (x: number, y: number, camera: THREE.Camera) {
    return this._shape.drag(x, y, camera)
  }

  /**
   * Highlight box
   * @param h
   * @param raycaster
   */
  public setHighlighted (intersection?: THREE.Intersection) {
    super.setHighlighted(intersection)
    this._shape.setHighlighted(intersection)
  }
}
